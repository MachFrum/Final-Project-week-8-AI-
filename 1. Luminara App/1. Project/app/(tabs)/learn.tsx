import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  RefreshCw, 
  Search, 
  Filter,
  Type,
  Mic,
  Camera,
  X,
  Send,
  Square,
  Play,
  Pause,
  ArrowLeft
} from 'lucide-react-native';
import ProblemPreview from '@/components/ProblemPreview';
import InputMethodCard from '@/components/InputMethodCard';
import PulsingActionButton from '@/components/PulsingActionButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import CameraCapture from '@/components/CameraCapture';
import { useProblemSubmission } from '@/hooks/useProblemSubmission';
import { useProblemHistory } from '@/hooks/useProblemHistory';
import { ProblemEntry, InputMethod } from '@/types/learning';
import { useTheme } from '@/contexts/ThemeContext';

export default function LearnScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [selectedInputMethod, setSelectedInputMethod] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  
  const { submitProblem, isSubmitting: isSubmittingProblem, result, error: submissionError, clearResult } = useProblemSubmission();
  const { problems, isLoading: isLoadingHistory, error: historyError, refetch } = useProblemHistory();
  
  const modalAnim = useRef(new Animated.Value(0)).current;
  const recordingAnim = useRef(new Animated.Value(1)).current;

  const inputMethods: InputMethod[] = [
    {
      id: 'text',
      title: 'Type Problem',
      description: 'Enter your question or problem as text',
      icon: 'type',
      color: colors.primary,
      type: 'text',
    },
    {
      id: 'voice',
      title: 'Voice Input',
      description: 'Record your question using voice',
      icon: 'mic',
      color: colors.primaryDark,
      type: 'voice',
    },
    {
      id: 'camera',
      title: 'Capture Image',
      description: 'Take a photo of your problem',
      icon: 'camera',
      color: colors.accent,
      type: 'camera',
    },
  ];

  const filteredProblems = problems.filter(problem =>
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const openInputModal = () => {
    setShowInputModal(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const closeInputModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowInputModal(false);
      setSelectedInputMethod(null);
      setTextInput('');
      setIsRecording(false);
      setIsProcessing(false);
    });
  };

  const handleInputMethodSelect = (methodId: string) => {
    setSelectedInputMethod(methodId);
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    
    submitTextProblem();
  };

  const submitTextProblem = async () => {
    setIsProcessing(true);
    
    try {
      const problemId = await submitProblem({
        title: textInput.substring(0, 50) + (textInput.length > 50 ? '...' : ''),
        inputType: 'text',
        textContent: textInput,
      });
      
      if (problemId) {
        // Keep modal open to show progress
        setTextInput('');
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to submit problem. Please try again.');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      submitVoiceProblem();
    } else {
      setIsRecording(true);
      // Start recording animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  };

  const submitVoiceProblem = async () => {
    setIsProcessing(true);
    
    try {
      const problemId = await submitProblem({
        title: 'Voice Problem',
        inputType: 'voice',
        voiceUrl: 'mock_voice_url', // In real implementation, this would be the recorded audio URL
      });
      
      if (problemId) {
        // Keep modal open to show progress
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process voice recording. Please try again.');
    }
  };

  const handleCameraCapture = () => {
    setShowCamera(true);
  };

  const handleCameraResult = (result: any) => {
    setShowCamera(false);
    submitImageProblem(result.uri);
  };

  const submitImageProblem = async (imageUri: string) => {
    setIsProcessing(true);
    
    try {
      const problemId = await submitProblem({
        title: 'Image Problem',
        inputType: 'image',
        imageUrl: imageUri,
      });
      
      if (problemId) {
        // Keep modal open to show progress
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  // Handle submission result
  React.useEffect(() => {
    if (result) {
      if (result.status === 'completed') {
        setIsProcessing(false);
        closeInputModal();
        Alert.alert('Success', 'Your problem has been solved! Check your learning history.');
        refetch(); // Refresh the problems list
      } else if (result.status === 'error') {
        setIsProcessing(false);
        Alert.alert('Error', result.errorMessage || 'Failed to process your problem.');
      }
    }
  }, [result]);

  // Handle submission errors
  React.useEffect(() => {
    if (submissionError) {
      setIsProcessing(false);
      Alert.alert('Error', submissionError);
    }
  }, [submissionError]);

  const renderInputContent = () => {
    if (!selectedInputMethod) {
      return (
        <View style={styles.inputMethodsContainer}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>How would you like to input your problem?</Text>
          {inputMethods.map((method, index) => (
            <InputMethodCard
              key={method.id}
              method={method}
              onPress={() => handleInputMethodSelect(method.id)}
              index={index}
            />
          ))}
        </View>
      );
    }

    switch (selectedInputMethod) {
      case 'text':
        return (
          <View style={styles.textInputContainer}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Type Your Problem</Text>
            
            {result && result.status === 'processing' && (
              <View style={styles.processingContainer}>
                <LoadingSpinner size={20} color={colors.primary} />
                <Text style={[styles.processingText, { color: colors.textSecondary }]}>
                  AI is analyzing your problem...
                </Text>
              </View>
            )}
            
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your question or problem here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              value={textInput}
              onChangeText={setTextInput}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.submitButton, !textInput.trim() && styles.submitButtonDisabled]}
              onPress={handleTextSubmit}
              disabled={!textInput.trim() || isProcessing}
            >
              <LinearGradient
                colors={textInput.trim() && !isProcessing ? [colors.primary, colors.primaryDark] : [colors.textTertiary, colors.textSecondary]}
                style={styles.submitGradient}
              >
                {isProcessing ? (
                  <LoadingSpinner size={20} color="#FFFFFF" />
                ) : (
                  <Send size={20} color="#FFFFFF" />
                )}
                <Text style={styles.submitText}>
                  {isProcessing ? 'Processing...' : 'Submit'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'voice':
        return (
          <View style={styles.voiceInputContainer}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Voice Recording</Text>
            
            {result && result.status === 'processing' && (
              <View style={styles.processingContainer}>
                <LoadingSpinner size={20} color={colors.primary} />
                <Text style={[styles.processingText, { color: colors.textSecondary }]}>
                  AI is processing your voice recording...
                </Text>
              </View>
            )}
            
            <View style={styles.voiceControls}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={toggleRecording}
                disabled={isProcessing}
              >
                <Animated.View
                  style={[
                    styles.recordButtonInner,
                    { transform: [{ scale: recordingAnim }] },
                    isRecording && { backgroundColor: colors.error },
                    !isRecording && { backgroundColor: colors.primary },
                  ]}
                >
                  {isProcessing ? (
                    <LoadingSpinner size={32} color="#FFFFFF" />
                  ) : isRecording ? (
                    <Square size={32} color="#FFFFFF" />
                  ) : (
                    <Mic size={32} color="#FFFFFF" />
                  )}
                </Animated.View>
              </TouchableOpacity>
              <Text style={[styles.recordingStatus, { color: colors.textSecondary }]}>
                {isProcessing ? 'Processing your recording...' :
                 isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
              </Text>
            </View>
          </View>
        );

      case 'camera':
        return (
          <View style={styles.cameraInputContainer}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Camera Capture</Text>
            
            {result && result.status === 'processing' && (
              <View style={styles.processingContainer}>
                <LoadingSpinner size={20} color={colors.primary} />
                <Text style={[styles.processingText, { color: colors.textSecondary }]}>
                  AI is analyzing your image...
                </Text>
              </View>
            )}
            
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleCameraCapture}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.cameraGradient}
                >
                  <Camera size={32} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={[styles.cameraStatus, { color: colors.textSecondary }]}>
                Tap to open camera
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraResult}
        onClose={handleCameraClose}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Learning History</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {problems.length} problems solved
          </Text>
          
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.overlayLight }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search problems, topics, or tags..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing || isLoadingHistory}
        >
          <LinearGradient
            colors={[colors.surface, colors.surfaceSecondary]}
            style={styles.refreshGradient}
          >
            {refreshing || isLoadingHistory ? (
              <LoadingSpinner size={20} color={colors.primary} />
            ) : (
              <RefreshCw size={20} color={colors.primary} />
            )}
            <Text style={[styles.refreshText, { color: colors.primary }]}>
              {refreshing || isLoadingHistory ? 'Loading...' : 'Refresh'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Problems List */}
        <ScrollView style={styles.problemsList} showsVerticalScrollIndicator={false}>
          {(historyError || submissionError) && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {historyError || submissionError}
              </Text>
            </View>
          )}
          
          {filteredProblems.length > 0 ? (
            filteredProblems.map((problem) => (
              <ProblemPreview key={problem.id} problem={problem} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No problems found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try adjusting your search terms' : 'Start solving problems to see them here'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        <View style={styles.fab}>
          <PulsingActionButton onPress={openInputModal} />
        </View>
      </View>

      {/* Input Modal */}
      <Modal
        visible={showInputModal}
        transparent
        animationType="none"
        onRequestClose={closeInputModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface },
              {
                transform: [
                  {
                    scale: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: modalAnim,
              },
            ]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={closeInputModal}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderInputContent()}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  refreshButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  refreshGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  problemsList: {
    flex: 1,
    marginBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputMethodsContainer: {
    paddingTop: 20,
  },
  textInputContainer: {
    paddingTop: 20,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  voiceInputContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  voiceControls: {
    alignItems: 'center',
  },
  recordButton: {
    marginBottom: 20,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingStatus: {
    fontSize: 16,
    textAlign: 'center',
  },
  cameraInputContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  cameraControls: {
    alignItems: 'center',
  },
  cameraButton: {
    marginBottom: 20,
    borderRadius: 50,
    overflow: 'hidden',
  },
  cameraGradient: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraStatus: {
    fontSize: 16,
    textAlign: 'center',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
});