import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PageHeader, PhoneValidationAlert, Loader } from '../../components';
import InfoIcon from '../../assets/info.svg';
import MessageIcon from '../../assets/sendChat.svg';
import UserIcon from '../../assets/user.svg';
import AttachmentIcon from '../../assets/attachment.svg';
import { chatAPI } from '../../services/chatAPI';
import { socketService } from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFileToCloudinary } from '../../services/api';

const AdminChatPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChatRoom, setCurrentChatRoom] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [showPhoneAlert, setShowPhoneAlert] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const messagesEndRef = useRef(null);
  const chatRoomIdRef = useRef(null);
  const userRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const timeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const { userId, adminId, userName } = location.state || {};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize Socket Connection
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setError('Authentication required');
      navigate('/login');
      return;
    }

    // Check if user is admin
    if (user?.role !== 'Admin') {
      navigate('/admin/chat-dashboard');
      return;
    }

    // Connect to socket
    socketService.connect(token);

    // Socket event handlers
    const onConnectionStatus = (status) => {
      setIsConnected(status);
      if (!status) {
        setLoading(false);
      }
    };
    const onAdminChatJoined = (data) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setCurrentChatRoom(data);
      if (data.adminChatRoomId) {
        chatRoomIdRef.current = data.adminChatRoomId;
      }
      setLoading(false);
    };
    const onAdminChatHistory = (historyMessages) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (historyMessages && historyMessages.length > 0) {
        const uniqueMessages = historyMessages.filter((msg, index, self) => 
          index === self.findIndex(m => 
            (m._id && m._id === msg._id) || 
            (m.id && m.id === msg.id) ||
            (m.content === msg.content && m.createdAt === msg.createdAt)
          )
        );
        setMessages(uniqueMessages);
      } else {
        setMessages([]);
      }
      setLoading(false);
    };
    const onAdminNewMessage = (message) => {
      const messageId = message._id || message.id || `${message.content}-${message.senderId?._id}-${message.createdAt}`;
      
      setMessages(prev => {
        const messageExists = prev.some(msg => {
          const existingId = msg._id || msg.id || `${msg.content}-${msg.senderId?._id}-${msg.createdAt}`;
          return existingId === messageId;
        });
        
        if (messageExists) {
          return prev;
        }
        
        return [...prev, message];
      });
      scrollToBottom();
    };
    const onSocketError = (error) => {
      setLoading(false);
      if (error.message && error.message.includes('Phone numbers are not allowed')) {
        setPhoneValidationError(error.message);
        setShowPhoneAlert(true);
      } else {
        setError(error.message || 'An error occurred');
      }
    };

    const onAdminMessagesMarkedRead = (data) => {
      setMessages(prev => prev.map(msg => {
        const myId = userRef.current?._id || userRef.current?.id || userRef.current?.userId;
        const msgSenderId = msg.senderId?._id || msg.senderId;
        const isSentByMe = msgSenderId === myId;
        
        if (isSentByMe) {
          return { ...msg, isRead: true };
        }
        return msg;
      }));
    };

    socketService.on('connectionStatus', onConnectionStatus);
    socketService.on('adminChatJoined', onAdminChatJoined);
    socketService.on('adminChatHistory', onAdminChatHistory);
    socketService.on('adminNewMessage', onAdminNewMessage);
    socketService.on('adminMessagesMarkedRead', onAdminMessagesMarkedRead);
    socketService.on('error', onSocketError);

    // Join chat room
    if (userId && roomId) {
      joinChatRoom(roomId, userId, adminId || user?._id);
    }

    // Cleanup
    return () => {
      socketService.off('connectionStatus', onConnectionStatus);
      socketService.off('adminChatJoined', onAdminChatJoined);
      socketService.off('adminChatHistory', onAdminChatHistory);
      socketService.off('adminNewMessage', onAdminNewMessage);
      socketService.off('adminMessagesMarkedRead', onAdminMessagesMarkedRead);
      socketService.off('error', onSocketError);
      socketService.leaveAdminChat();
    };
  }, [navigate, userId, roomId, adminId, user]);

  // Join chat room
  const joinChatRoom = async (roomId, userId, adminId) => {
    try {
      setLoading(true);
      setMessages([]);
      setError('');
      
      const currentAdminId = user?._id || user?.id || user?.userId;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        setError('Connection timeout. Please try again.');
        timeoutRef.current = null;
      }, 10000);
      
      socketService.joinAdminChat(userId, currentAdminId);
    } catch (error) {
      console.error('Error joining chat room:', error);
      setError('Failed to join chat room');
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setNewMessage(file.name);
    }
  };

  // Upload file and send message
  const handleFileUpload = async () => {
    if (!selectedFile || !currentChatRoom?.adminChatRoomId) return;

    try {
      setUploadingFile(true);
      setError('');
      
      // Upload file to Cloudinary
      const uploadedFile = await uploadFileToCloudinary(selectedFile, 'files');
      
      if (!uploadedFile || !uploadedFile.url) {
        throw new Error('Failed to upload file');
      }

      // Send message with file
      const fileData = {
        url: uploadedFile.url,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size
      };

      socketService.sendAdminMessage(
        currentChatRoom.adminChatRoomId,
        selectedFile.name,
        'file',
        fileData
      );

      // Reset file input
      setSelectedFile(null);
      setNewMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (selectedFile) {
      handleFileUpload();
      return;
    }

    if (newMessage.trim() && currentChatRoom?.adminChatRoomId && isConnected) {
      socketService.sendAdminMessage(currentChatRoom.adminChatRoomId, newMessage.trim());
      setNewMessage('');
      setSelectedFile(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentChatRoom?.adminChatRoomId && messages.length > 0) {
      const hasUnreadFromOther = messages.some(msg => {
        const isSentByMe = msg.senderId?._id === (user?._id || user?.id || user?.userId) || 
                          msg.senderId === (user?._id || user?.id || user?.userId);
        return !isSentByMe && !msg.isRead;
      });

      if (hasUnreadFromOther) {
        socketService.markAdminMessagesAsRead(currentChatRoom.adminChatRoomId);
      }
    }
  }, [currentChatRoom, messages, user]);

  const handleBack = () => {
    navigate('/admin/chat-dashboard');
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setNewMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl py-2 sm:py-3">
          <PageHeader
            title={userName || 'Admin Chat'}
            onBack={handleBack}
            titleClassName="text-base sm:text-lg font-semibold text-gray-900"
            backButtonClassName="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer mr-2 sm:mr-3"
          />
        </div>
        
        <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl bg-white rounded-xl shadow-custom pt-1 overflow-x-hidden">
          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg mx-4 mb-4">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="px-4 py-8">
              <Loader message="Loading chat..." />
            </div>
          )}

          {/* Safety Banner */}
          <div className="bg-[#F9FAFB] px-3 sm:px-4 py-2 sm:py-3 mt-3 sm:mt-4 rounded-2xl shadow-custom border border-primary-200 max-w-lg mx-auto">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <img src={InfoIcon} alt="Info" className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-primary-200 font-medium leading-relaxed">
                For safety, phone numbers and emails are hidden. Please chat only through Aussie Mate.
              </p>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 overflow-y-auto min-h-[400px] max-h-[600px]">
            {messages.length === 0 && !loading && (
              <div className="text-center py-8 text-primary-200">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            
            {messages.map((msg, index) => {
              const isSentByCurrentUser = msg.senderId?._id === (user?._id || user?.id || user?.userId);
              const messageTime = msg.createdAt ? 
                new Date(msg.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }).toLowerCase() : '';

              const uniqueKey = msg._id || msg.id || `msg-${index}-${msg.content?.slice(0, 10) || 'empty'}`;
              const isFileMessage = msg.messageType === 'file' || msg.fileData;

              return (
                <div
                  key={uniqueKey}
                  className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[280px] sm:max-w-xs md:max-w-md ${isSentByCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    {!isSentByCurrentUser && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <img src={UserIcon} alt="User" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className="flex flex-col">
                      <div
                        className={`px-2.5 sm:px-3 py-2 sm:py-3 rounded-2xl text-primary-500 font-medium ${
                          isSentByCurrentUser
                            ? 'bg-white border border-gray-200'
                            : 'bg-[#EBF2FD]'
                        }`}
                      >
                        {isFileMessage ? (
                          <div className="flex items-center space-x-2">
                            <img src={AttachmentIcon} alt="File" className="w-4 h-4" />
                            <a
                              href={msg.fileData?.url || msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-blue-600 hover:underline break-all"
                            >
                              {msg.fileData?.fileName || msg.content || 'File'}
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                            {msg.content}
                          </p>
                        )}
                      </div>
                      
                      <span className="text-xs text-gray-500 mt-1 flex items-center">
                        {messageTime}
                        {isSentByCurrentUser && (
                          <span className={`ml-1 font-bold ${msg.isRead ? 'text-green-500' : 'text-gray-400'}`}>
                            {msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {/* User Avatar */}
                    {isSentByCurrentUser && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <img src={UserIcon} alt="You" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Selected File Preview */}
          {selectedFile && (
            <div className="px-3 sm:px-6 py-2 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src={AttachmentIcon} alt="File" className="w-4 h-4" />
                  <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          
          {/* Message Input */}
          <div className="bg-white py-2 sm:py-3 px-3 sm:px-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile || !isConnected || !currentChatRoom}
                className="p-2 sm:p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <img src={AttachmentIcon} alt="Attach" className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedFile ? "File selected. Click send to upload." : "Type your message..."}
                disabled={!isConnected || !currentChatRoom || uploadingFile}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base disabled:bg-gray-100"
              />
              <button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !selectedFile) || !isConnected || !currentChatRoom || uploadingFile}
                className="p-2 sm:p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingFile ? (
                  <Loader message="" className="w-5 h-5" />
                ) : (
                  <img src={MessageIcon} alt="Send" className="w-5 h-5 sm:w-6 sm:h-6 brightness-0 invert" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Phone Validation Alert */}
        <PhoneValidationAlert
          error={phoneValidationError}
          onClose={() => {
            setShowPhoneAlert(false);
            setPhoneValidationError('');
          }}
          isVisible={showPhoneAlert}
        />
      </div>
    </>
  );
};

export default AdminChatPage;

