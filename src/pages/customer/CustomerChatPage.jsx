import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, PageHeader, PhoneValidationAlert, Loader, ConfirmationModal } from '../../components';
import InfoIcon from '../../assets/info.svg';
import MessageIcon from '../../assets/sendChat.svg';
import UserIcon from '../../assets/user.svg';
import { jobsAPI, quotesAPI } from '../../services/api';
import { chatAPI } from '../../services/chatAPI';
import { socketService } from '../../services/socketService';

const CustomerChatPage = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('cleaner');


  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChatRoom, setCurrentChatRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [showPhoneAlert, setShowPhoneAlert] = useState(false);
  const [cleanerName, setCleanerName] = useState('');

  const [newMessage, setNewMessage] = useState('');
  const [quoteData, setQuoteData] = useState({
    baseQuote: 0,
    addons: [],
    total: 0
  });
  const [jobData, setJobData] = useState(null);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  const messagesEndRef = useRef(null);
  const chatRoomIdRef = useRef(null);
  const currentUserRef = useRef(null);

  // Sync refs with state
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Initialize Socket Connection and User Data
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      setError('Authentication required');
      navigate('/login');
      return;
    }

    setCurrentUser(user);

    // Connect to socket
    socketService.connect(token);

    // Socket event handlers
    const onConnectionStatus = (status) => setIsConnected(status);
    const onChatJoined = (data) => {
      setCurrentChatRoom(data);
      if (data.chatRoomId) {
        chatRoomIdRef.current = data.chatRoomId;
      }
    };
    const onChatHistory = (historyMessages) => {
      if (historyMessages && historyMessages.length > 0) {
        const uniqueMessages = historyMessages.filter((msg, index, self) =>
          index === self.findIndex(m =>
            (m._id && m._id === msg._id) ||
            (m.id && m.id === msg.id) ||
            (m.content === msg.content && m.timestamp === msg.timestamp)
          )
        );
        setMessages(uniqueMessages);
      } else {
        setMessages([]);
      }
      setLoading(false);
    };
    const onNewMessage = (message) => {
      const messageId = message._id || message.id || `${message.content}-${message.senderId?._id}-${message.createdAt}`;

      setMessages(prev => {
        const incomingContent = message.content || message.message || '';
        const incomingId = message._id || message.id;

        const existsById = prev.some(msg =>
          !msg.isOptimistic && (
            (msg._id && msg._id === incomingId) ||
            (msg.id && msg.id === incomingId)
          )
        );
        if (existsById) {
          return prev;
        }

        const optimisticIndex = prev.findIndex(msg =>
          msg.isOptimistic && (
            (msg.content && msg.content.trim() === incomingContent.trim()) ||
            (msg.message && msg.message.trim() === incomingContent.trim())
          )
        );

        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = { ...message, isOptimistic: false };
          return updated;
        }

        return [...prev, message];
      });
      scrollToBottom();
    };
    const onSocketError = (error) => {
      if (error.message && error.message.includes('Phone numbers are not allowed')) {
        setPhoneValidationError(error.message);
        setShowPhoneAlert(true);
      } else if (error.message === 'Cleaner has not quoted on this job') {
        setLoading(false);
      } else {
        setError(error.message);
        setLoading(false);
      }
    };

    const onMessagesMarkedRead = (data) => {
      setMessages(prev => prev.map(msg => {
        const myId = currentUserRef.current?._id || currentUserRef.current?.id || currentUserRef.current?.userId;
        const msgSenderId = msg.senderId?._id || msg.senderId;
        const isSentByMe = msgSenderId === myId;

        if (isSentByMe) {
          return { ...msg, isRead: true };
        }
        return msg;
      }));
    };

    socketService.on('connectionStatus', onConnectionStatus);
    socketService.on('chatJoined', onChatJoined);
    socketService.on('chatHistory', onChatHistory);
    socketService.on('newMessage', onNewMessage);
    socketService.on('messagesMarkedRead', onMessagesMarkedRead);
    socketService.on('error', onSocketError);

    return () => {
      socketService.off('connectionStatus', onConnectionStatus);
      socketService.off('chatJoined', onChatJoined);
      socketService.off('chatHistory', onChatHistory);
      socketService.off('newMessage', onNewMessage);
      socketService.off('messagesMarkedRead', onMessagesMarkedRead);
      socketService.off('error', onSocketError);
      socketService.disconnect();
    };
  }, [navigate]);

  // Fetch job details to track booking state
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (jobId) {
        try {
          const response = await jobsAPI.getJobById(jobId);
          if (response.success && response.data) {
            setJobData(response.data);
          }
        } catch (err) {
          console.error("Error fetching job details in chat page:", err);
        }
      }
    };
    fetchJobDetails();
  }, [jobId]);

  // Join Chat Room
  useEffect(() => {
    if (jobId && cleanerId && cleanerId !== 'undefined' && cleanerId !== 'null' && isConnected) {

      // First, let's verify the cleaner has actually quoted for this job
      const verifyCleanerQuote = async () => {
        try {
          const jobResponse = await jobsAPI.getJobById(jobId);
          if (jobResponse.success && jobResponse.data) {
            const job = jobResponse.data;
            setJobData(job);
            const cleaners = [...(job.quotes || []), ...(job.contactedCleaners || [])];

            // Try to find the cleaner in the job data
            let cleanerQuote = cleaners.find(item => {
              const itemCleanerId = item.cleanerId?._id || item.cleanerId || item.id;
              return itemCleanerId === cleanerId || String(itemCleanerId) === String(cleanerId);
            });

            if (!cleanerQuote) {
              cleanerQuote = cleaners.find(item => {
                const itemId = item._id || item.id;
                return itemId === cleanerId || String(itemId) === String(cleanerId);
              });
            }

            if (cleanerQuote) {
              setCurrentQuote(cleanerQuote);
              // Set quote data for display
              setQuoteData({
                baseQuote: cleanerQuote.basePrice || cleanerQuote.price || 0,
                addons: cleanerQuote.addons || [],
                total: cleanerQuote.totalPrice || cleanerQuote.price || 0
              });

              // Set cleaner name
              const cleanerObj = cleanerQuote.cleaner || cleanerQuote.cleanerId;
              if (cleanerObj && (cleanerObj.firstName || cleanerObj.lastName)) {
                setCleanerName(`${cleanerObj.firstName || ''} ${cleanerObj.lastName || ''}`.trim());
              }

              // Join chat with the actual cleaner ID or room ID
              const actualCleanerId = cleanerQuote.cleanerId?._id || cleanerQuote.cleanerId?.id || cleanerQuote.cleanerId || cleanerQuote.id;

              if (cleanerQuote.chatRoomId) {
                setCurrentChatRoom({ chatRoomId: cleanerQuote.chatRoomId });
                chatRoomIdRef.current = cleanerQuote.chatRoomId;
                socketService.joinRoom(cleanerQuote.chatRoomId);
              } else {
                socketService.joinChat(jobId, actualCleanerId || cleanerId);
              }
            } else {
              // If not found in job data, try to join anyway using the ID from URL
              socketService.joinChat(jobId, cleanerId);
            }
          } else {
            // Job fetch failed, try to join anyway
            socketService.joinChat(jobId, cleanerId);
          }
          setLoading(false);
        } catch (err) {
          // If verification fails, try to join anyway before giving up
          socketService.joinChat(jobId, cleanerId);
          setLoading(false);
        }
      };

      verifyCleanerQuote();
    } else if (!isConnected || !cleanerId || cleanerId === 'undefined' || cleanerId === 'null') {
      // Start with empty messages if not connected or no valid cleanerId
      setMessages([]);
      setLoading(false);
    }
  }, [jobId, cleanerId, isConnected]);

  useEffect(() => {
    const loadChatHistoryFallback = async () => {
      if (jobId && cleanerId) {
        try {
          const response = await chatAPI.getChatHistory(jobId, cleanerId);

          if (response.success && response.data?.messages) {
            setMessages(response.data.messages);
          }
        } catch (error) {
        }
      }
    };

    loadChatHistoryFallback();
    const timeoutId = setTimeout(loadChatHistoryFallback, 3000);
    return () => clearTimeout(timeoutId);
  }, [jobId, cleanerId]);

  useEffect(() => {
    if (currentChatRoom?.chatRoomId && messages.length > 0) {
      const hasUnreadFromOther = messages.some(msg => {
        const isSentByMe = msg.senderId?._id === (currentUser?._id || currentUser?.id || currentUser?.userId) ||
          msg.senderId === (currentUser?._id || currentUser?.id || currentUser?.userId);
        return !isSentByMe && !msg.isRead;
      });

      if (hasUnreadFromOther) {
        socketService.markAsRead(currentChatRoom.chatRoomId);
      }
    }
  }, [currentChatRoom, messages, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {

      const tempMessage = {
        _id: `temp-${Date.now()}`,
        id: `temp-${Date.now()}`,
        senderId: { _id: currentUser?.id || currentUser?._id || 'user' },
        content: newMessage.trim(),
        message: newMessage.trim(),
        messageType: 'text',
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).toLowerCase(),
        isOptimistic: true
      };

      if (currentChatRoom?.chatRoomId && isConnected) {
        setMessages(prev => [...prev, tempMessage]);
        socketService.sendMessage(currentChatRoom.chatRoomId, newMessage.trim());
        setNewMessage('');
        scrollToBottom();
      } else {
        setMessages(prev => [...prev, { ...tempMessage, isOptimistic: false }]);
        setNewMessage('');
        scrollToBottom();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleDecline = async () => {
    if (!currentQuote) return;
    const quoteId = currentQuote._id || currentQuote.id;
    try {
      setIsDeclining(true);
      const response = await quotesAPI.declineQuote(quoteId);
      if (response.success) {
        navigate(`/customer-job-details/${jobId}`);
      } else {
        alert(response.message || response.error || 'Failed to decline quote');
      }
    } catch (err) {
      console.error("Failed to decline quote:", err);
      alert(err.message || 'Failed to decline quote. Please try again.');
    } finally {
      setIsDeclining(false);
    }
  };

  const handleConfirmAccept = async () => {
    try {
      setIsAccepting(true);

      if (currentQuote && !currentQuote.isConnected) {
        try {
          await jobsAPI.connectCleaner(jobId, cleanerId);
        } catch (connectErr) {
          if (!connectErr.message?.includes('Already connected')) {
            throw connectErr;
          }
        }
      }

      const response = await jobsAPI.assignCleaner(jobId, cleanerId);
      if (response.success) {
        navigate(`/booking-confirmation/${jobId}?cleaner=${cleanerId}`);
      } else {
        alert(response.message || response.error || 'Failed to assign cleaner');
      }
    } catch (err) {
      console.error("Failed to assign cleaner:", err);
      alert(err.message || 'Failed to assign cleaner. Please try again.');
    } finally {
      setIsAccepting(false);
      setShowAcceptModal(false);
    }
  };

  return (
    <div className='px-4 md:px-8 h-[calc(100dvh-90px)] flex flex-col overflow-hidden'>
      <div className="max-w-7xl w-full mx-auto py-2 flex-shrink-0 capitalize">
        <PageHeader
          title={cleanerName || `Cleaner #${cleanerId?.slice(-4) || '1047'}`}
          onBack={() => navigate(-1)}
          titleClassName="text-base sm:text-lg font-semibold text-gray-900"
          backButtonClassName="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        />
      </div>

      <div className="bg-white rounded-xl shadow-custom flex flex-col flex-1 overflow-hidden mb-2">
        {/* Chat Header Inside Box */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white flex-shrink-0 font-bold">
              {cleanerName ? cleanerName.charAt(0).toUpperCase() : 'C'}
            </div>

            {/* Name and Status */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                {cleanerName || `Cleaner #${cleanerId?.slice(-4) || '1047'}`}
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Cleaner &middot; Available
              </p>
            </div>
          </div>

          {loading || !jobData ? (
            null
          ) : ((jobData.assignedCleanerId?._id || jobData.assignedCleanerId) === cleanerId) ? (
            <div className="flex items-center gap-1 bg-[#E6F4EA] text-[#137333] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Assigned</span>
            </div>
          ) : null}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg mx-4 mt-4">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                onClick={() => navigate(`/customer-job-details/${jobId}`)}
                variant="danger"
                size="xs"
                className="ml-3"
              >
                Go Back
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="px-4 py-8">
            <Loader message="Loading chat..." />
          </div>
        )}


        {/* Chat Messages */}
        <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 overflow-y-auto">
          {messages.map((msg, index) => {
            const isSentByCurrentUser = msg.senderId?._id === currentUser?.id || msg.senderId?._id === currentUser?._id || msg.sender === 'user';
            const messageTime = msg.createdAt ?
              new Date(msg.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }).toLowerCase() :
              msg.timestamp || '';

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
                      <img src={UserIcon} alt="Cleaner" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    {/* Quote Message */}
                    {msg.messageType === 'quote' && msg.quoteData && (
                      <div className="px-2.5 sm:px-3 py-2 sm:py-3 rounded-2xl bg-[#EBF2FD] text-primary-500 font-medium mb-2">
                        <div className="text-xs font-semibold text-primary-500 mb-2">💰 Quote Update</div>
                        <div className="text-xs space-y-1">
                          <div>Price: <span className="font-semibold">${msg.quoteData.price}</span></div>
                          <div>Duration: <span className="font-semibold">{msg.quoteData.estimatedDuration}</span></div>
                          {msg.quoteData.availability && (
                            <div>Available: <span className="font-semibold">
                              {new Date(msg.quoteData.availability).toLocaleDateString()}
                            </span></div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Budget Update Message */}
                    {msg.messageType === 'budget_update' && msg.budgetData && (
                      <div className="px-2.5 sm:px-3 py-2 sm:py-3 rounded-2xl bg-white border border-gray-200 text-primary-500 font-medium mb-2">
                        <div className="text-xs font-semibold text-primary-500 mb-2">💵 Budget Update</div>
                        <div className="text-xs space-y-1">
                          <div>Amount: <span className="font-semibold">${msg.budgetData.amount}</span></div>
                          <div>Status: <span className="font-semibold">
                            {msg.budgetData.isNegotiable ? 'Negotiable' : 'Fixed'}
                          </span></div>
                        </div>
                      </div>
                    )}

                    {/* Regular Text Message */}
                    {(msg.content || msg.message) && (
                      <div
                        className={`px-2.5 sm:px-3 py-2 sm:py-3 rounded-2xl text-primary-500 font-medium ${isSentByCurrentUser
                          ? 'bg-white border border-gray-200'
                          : 'bg-[#EBF2FD]'
                          }`}
                      >
                        <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                          {msg.content || msg.message}
                        </p>
                      </div>
                    )}

                    <span className="text-xs text-gray-500 mt-1">
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

        {/* Chat Action Footer (Accept/Reject) has been moved to CustomerJobDetailsPage.jsx */}

        {/* Message Input */}
        <div className="bg-white py-2 sm:py-3 px-3 sm:px-6 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message..."
              className="flex-1 px-3 py-3 border border-primary-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-500 shadow-custom bg-[#F9FAFB]"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              variant="ghost"
              size=""
              icon={MessageIcon}
              className="p-1 sm:p-2 [&>img]:w-8 [&>img]:h-8"
            />
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

      {/* Accept Cleaner Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onConfirm={handleConfirmAccept}
        title={cleanerName ? `Accept ${cleanerName}?` : "Accept Cleaner?"}
        message={
          cleanerName ?
            `Are you sure you want to accept and book ${cleanerName} for this job?` :
            "Are you sure you want to accept and book this cleaner for this job?"
        }
        confirmText="Accept & Book"
        cancelText="Cancel"
        confirmButtonColor="bg-green-600 hover:bg-green-700"
        isLoading={isAccepting}
      />
    </div>
  );
};

export default CustomerChatPage;
