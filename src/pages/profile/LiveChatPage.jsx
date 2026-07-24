import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PhoneValidationAlert, Loader } from '../../components';
import InfoIcon from '../../assets/info.svg';
import MessageIcon from '../../assets/sendChat.svg';
import UserIcon from '../../assets/user.svg';
import { chatAPI } from '../../services/chatAPI';
import { socketService } from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFileToCloudinary } from '../../services/api';

const LiveChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChatRoom, setCurrentChatRoom] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [showPhoneAlert, setShowPhoneAlert] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [adminChatRooms, setAdminChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const messagesEndRef = useRef(null);
  const chatRoomIdRef = useRef(null);
  const userRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const timeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const isAdmin = user?.role === 'Admin';

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
      setSelectedRoomId(data.adminChatRoomId);
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

    if (socketService.isConnected) {
      setIsConnected(true);
      if (!selectedRoomId) {
        setLoading(false);
      }
    } else {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 3000);
    }

    return () => {
      socketService.off('connectionStatus', onConnectionStatus);
      socketService.off('adminChatJoined', onAdminChatJoined);
      socketService.off('adminChatHistory', onAdminChatHistory);
      socketService.off('adminNewMessage', onAdminNewMessage);
      socketService.off('adminMessagesMarkedRead', onAdminMessagesMarkedRead);
      socketService.off('error', onSocketError);
      socketService.leaveAdminChat();
    };
  }, [navigate]);

  // Load admin chat rooms
  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        setLoading(true);
        const response = await chatAPI.getAdminChatRooms();
        if (response.success) {
          setAdminChatRooms(response.data || []);
          
          if (response.data && response.data.length > 0 && !selectedRoomId) {
            const firstRoom = response.data[0];
            joinChatRoom(firstRoom._id, firstRoom.userId?._id, firstRoom.adminId?._id);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading chat rooms:', error);
        setLoading(false);
      }
    };

    if (isConnected) {
      loadChatRooms();
    } else {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isConnected]);

  // Join chat room
  const joinChatRoom = async (roomId, userId, adminId) => {
    try {
      setLoading(true);
      setMessages([]);
      setSelectedRoomId(roomId);
      setError('');
      
      const currentUserId = user?._id || user?.id || user?.userId;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        setError('Connection timeout. Please try again.');
        timeoutRef.current = null;
      }, 10000);
      
      if (isAdmin) {
        if (!userId) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setError('User ID is required');
          setLoading(false);
          return;
        }
        socketService.joinAdminChat(userId, currentUserId);
      } else {
        socketService.joinAdminChat(currentUserId, adminId || null);
      }
    } catch (error) {
      console.error('Error joining chat room:', error);
      setError('Failed to join chat room');
      setLoading(false);
    }
  };

  // Create new chat room (for users)
  const createNewChatRoom = async () => {
    try {
      setLoading(true);
      setError('');
      const currentUserId = user?._id || user?.id || user?.userId;
      const response = await chatAPI.createAdminChatRoom(currentUserId, null);
      
      if (response.success) {
        const room = response.data;
        joinChatRoom(room._id, room.userId?._id, room.adminId?._id);
        
        const roomsResponse = await chatAPI.getAdminChatRooms();
        if (roomsResponse.success) {
          setAdminChatRooms(roomsResponse.data || []);
        }
      } else {
        const errorMessage = response.error || response.message || 'Failed to create chat room';
        setError(errorMessage);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
      const errorMessage = error?.response?.error || error?.response?.message || error?.message || 'Failed to create chat room';
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (newMessage.trim() && currentChatRoom?.adminChatRoomId && isConnected) {
      socketService.sendAdminMessage(currentChatRoom.adminChatRoomId, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (currentChatRoom?.adminChatRoomId && messages.length > 0) {
      // Check if there are unread messages from the OTHER user
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
    navigate(-1);
  };

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/chat-dashboard');
    }
  }, [isAdmin, navigate]);

  // If user and no room exists, show create button
  if (adminChatRooms.length === 0 && !currentChatRoom) {
    return (
      <>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <PageHeader
            title="Live Chat Support"
            onBack={handleBack}
            className="mb-6"
            titleClassName="text-lg sm:text-xl font-semibold text-gray-900"
          />

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-custom text-center">
            <p className="text-primary-500 mb-4">Start a conversation with our support team</p>
            {loading ? (
              <Loader message="Creating chat room..." />
            ) : (
              <button
                onClick={createNewChatRoom}
                disabled={loading}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Chat
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <div className="max-w-7xl ">
      <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl py-2 sm:py-3">
        <PageHeader
          title={isAdmin ? 'Admin Chat' : 'Live Chat Support'}
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
                      <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                        {msg.content}
                      </p>
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
        
        {/* Message Input */}
        <div className="bg-white py-2 sm:py-3 px-3 sm:px-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={!isConnected || !currentChatRoom}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected || !currentChatRoom}
              className="p-2 sm:p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img src={MessageIcon} alt="Send" className="w-5 h-5 sm:w-6 sm:h-6 brightness-0 invert" />
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

export default LiveChatPage;
