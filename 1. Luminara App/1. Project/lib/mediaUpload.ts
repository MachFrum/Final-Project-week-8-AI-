import { supabase } from './supabase';
import { securityManager } from './security';
import { generateUUID, isValidUUID } from '@/utils/uuid';

export interface MediaUploadOptions {
  userId: string;
  file: File;
  bucket: 'user-uploads' | 'problem-images' | 'voice-recordings';
  folder?: string;
  metadata?: Record<string, any>;
}

export interface MediaUploadResult {
  success: boolean;
  uploadId?: string;
  url?: string;
  error?: string;
}

export class MediaUploadManager {
  // Upload file with security validation
  async uploadFile(options: MediaUploadOptions): Promise<MediaUploadResult> {
    const { userId, file, bucket, folder, metadata } = options;

    // Validate user ID
    if (!isValidUUID(userId)) {
      return { success: false, error: 'Invalid user ID' };
    }

    // Validate file
    const fileValidation = securityManager.validateFileUpload(file);
    if (!fileValidation.valid) {
      return { success: false, error: fileValidation.error };
    }

    // Check user permissions
    const hasPermission = await securityManager.validateUserPermission(userId, 'upload_media');
    if (!hasPermission) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Check rate limiting
    if (!securityManager.checkRateLimit(`upload_${userId}`)) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const uploadId = generateUUID();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uploadId}.${fileExtension}`;
      const filePath = folder ? `${userId}/${folder}/${fileName}` : `${userId}/${fileName}`;

      // Create upload record
      const { error: dbError } = await supabase
        .from('media_uploads')
        .insert({
          id: uploadId,
          user_id: userId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          upload_status: 'pending',
          metadata: metadata || {}
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        return { success: false, error: 'Failed to create upload record' };
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // Update upload status to failed
        await supabase
          .from('media_uploads')
          .update({ upload_status: 'failed' })
          .eq('id', uploadId);

        return { success: false, error: 'Failed to upload file' };
      }

      // Update upload status to completed
      await supabase
        .from('media_uploads')
        .update({ upload_status: 'completed' })
        .eq('id', uploadId);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Log security event
      await securityManager.logSecurityEvent(
        userId,
        'file_upload',
        'media_upload',
        uploadId,
        { fileName: file.name, fileSize: file.size, bucket }
      );

      return {
        success: true,
        uploadId,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Upload failed' };
    }
  }

  // Get user's uploaded files
  async getUserUploads(userId: string, limit: number = 50): Promise<any[]> {
    if (!isValidUUID(userId)) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('media_uploads')
        .select('*')
        .eq('user_id', userId)
        .eq('upload_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching uploads:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get uploads error:', error);
      return [];
    }
  }

  // Delete uploaded file
  async deleteFile(userId: string, uploadId: string): Promise<boolean> {
    if (!isValidUUID(userId) || !isValidUUID(uploadId)) {
      return false;
    }

    try {
      // Get upload record
      const { data: upload, error: fetchError } = await supabase
        .from('media_uploads')
        .select('*')
        .eq('id', uploadId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !upload) {
        return false;
      }

      // Delete from storage
      const bucket = upload.storage_path.includes('problem-images') ? 'problem-images' :
                    upload.storage_path.includes('voice-recordings') ? 'voice-recordings' : 'user-uploads';

      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([upload.storage_path]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
      }

      // Update database record
      await supabase
        .from('media_uploads')
        .update({ upload_status: 'deleted' })
        .eq('id', uploadId);

      // Log security event
      await securityManager.logSecurityEvent(
        userId,
        'file_delete',
        'media_upload',
        uploadId
      );

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  // Clean up expired uploads
  async cleanupExpiredUploads(): Promise<void> {
    try {
      const { data: expiredUploads, error } = await supabase
        .from('media_uploads')
        .select('id, storage_path')
        .lt('expires_at', new Date().toISOString())
        .eq('upload_status', 'completed');

      if (error || !expiredUploads) {
        return;
      }

      for (const upload of expiredUploads) {
        // Delete from storage
        const bucket = upload.storage_path.includes('problem-images') ? 'problem-images' :
                      upload.storage_path.includes('voice-recordings') ? 'voice-recordings' : 'user-uploads';

        await supabase.storage
          .from(bucket)
          .remove([upload.storage_path]);

        // Update database
        await supabase
          .from('media_uploads')
          .update({ upload_status: 'deleted' })
          .eq('id', upload.id);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export const mediaUploadManager = new MediaUploadManager();