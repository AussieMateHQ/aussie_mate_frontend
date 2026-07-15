import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FloatingLabelInput, ConfirmationModal, PhoneValidationAlert, PageHeader, Loader, Button } from '../../components';
import InfoIcon from '../../assets/info.svg';
import SendIcon from '../../assets/sendChat.svg';
import MessageIcon from '../../assets/message2.svg';
import { jobsAPI, quotesAPI, subscriptionsAPI } from '../../services/api';
import { chatAPI } from '../../services/chatAPI';
import { socketService } from '../../services/socketService';
import WithdrawIcon from '../../assets/trash-red.svg';
import UserIcon from '../../assets/user.svg';


const CleanerChatPage = () => {
    const navigate = useNavigate();
    const { jobId } = useParams();
    const [searchParams] = useSearchParams();
    const cleanerId = searchParams.get('cleanerId');
    const [hasSubmittedQuote, setHasSubmittedQuote] = useState(false);
    const [quoteStatus, setQuoteStatus] = useState('pending');
    const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
    const [myQuote, setMyQuote] = useState(null);
    const [job, setJob] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [phoneValidationError, setPhoneValidationError] = useState('');
    const [showPhoneAlert, setShowPhoneAlert] = useState(false);
    
    const [quoteAmount, setQuoteAmount] = useState('');
    const [isNegotiable, setIsNegotiable] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [hasShownModalOnce, setHasShownModalOnce] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [sentQuote, setSentQuote] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentChatRoom, setCurrentChatRoom] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [effectiveCleanerId, setEffectiveCleanerId] = useState(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const isContacted = React.useMemo(() => {
        if (!job || !currentUser) return false;
        const currentUserId = currentUser.id || currentUser._id;
        return (job.contactedCleaners || []).some(c => 
            (c.cleanerId?._id || c.cleanerId) === currentUserId
        );
    }, [job, currentUser]);
    const [waitlistNotice, setWaitlistNotice] = useState(null);
    const messagesEndRef = useRef(null);
    const chatRoomIdRef = useRef(null);
    const currentUserRef = useRef(null);

    // Sync ref with state
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);
    const lastMessageRef = useRef(null);

    // Lock body scroll when budget modal is open
    useEffect(() => {
        if (showBudgetModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showBudgetModal]);

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
        
        // Set effective cleaner ID
        const urlCleanerId = searchParams.get('cleanerId');
        const userCleanerId = user?.id || user?._id;
        setEffectiveCleanerId(urlCleanerId || userCleanerId);
        
        // Connect to socket directly
        socketService.connect(token);

        // Fetch subscription status
        const fetchSubscriptionStatus = async () => {
            try {
                const response = await subscriptionsAPI.getMyStatus();
                if (response.success && response.data) {
                    setIsSubscriptionExpired(response.data.isSubscriptionExpired);
                    setSubscriptionStatus(response.data);
                }
            } catch (err) {
                console.error('Error fetching subscription status:', err);
            }
        };

        fetchSubscriptionStatus();

        // Socket event handlers
        const onConnectionStatus = (status) => setIsConnected(status);
        const onChatJoined = (data) => {
            setCurrentChatRoom(data);
            if (data.chatRoomId) {
                chatRoomIdRef.current = data.chatRoomId;
            }
        };
        const onChatNotFound = (data) => setMessages([]);
        const onChatHistory = (historyMessages) => {
            setIsLoadingMessages(false);
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
        };
        const onNewMessage = (message) => {
            const messageId = message._id || message.id || `${message.content || message.message}-${message.senderId?._id}-${message.createdAt}`;
            
            if (lastMessageRef.current === messageId) {
                return;
            }
            
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
            
            lastMessageRef.current = messageId;
            scrollToBottom();
        };
        const onSocketError = (error) => {
            if (error.message && error.message.includes('Phone numbers are not allowed')) {
                setPhoneValidationError(error.message);
                setShowPhoneAlert(true);
            } else if (error.message === 'Failed to join chat') {
                // Silently handle
            } else if (error.message === 'You must submit a quote for this job first. Once the customer accepts your quote, you can start chatting.') {
                // Silently handle
            } else if (error.message === 'Access denied. Please check your login status or contact support.') {
                setError('You do not have permission to access this chat. Please contact support if this is an error.');
            } else if (error.message === 'Failed to send quote') {
                // Ignore
            } else {
                setError(error.message);
            }
        };

        const onMessagesMarkedRead = (data) => {
            console.log('📖 [SOCKET] Messages marked as read:', data);
            
            // Mark our sent messages as read.
            // Socket.io room scoping helps ensure we only get relevant events.
            setMessages(prev => prev.map(msg => {
                const myId = currentUserRef.current?._id || currentUserRef.current?.id;
                const msgSenderId = msg.senderId?._id || msg.senderId;
                const isSentByMe = msgSenderId === myId;
                
                if (isSentByMe) {
                    return { ...msg, isRead: true };
                }
                return msg;
            }));
        };

        // Socket event listeners
        socketService.on('connectionStatus', onConnectionStatus);
        socketService.on('chatJoined', onChatJoined);
        socketService.on('chatNotFound', onChatNotFound);
        socketService.on('chatHistory', onChatHistory);
        socketService.on('newMessage', onNewMessage);
        socketService.on('messagesMarkedRead', onMessagesMarkedRead);
        socketService.on('error', onSocketError);

        return () => {
            socketService.off('connectionStatus', onConnectionStatus);
            socketService.off('chatJoined', onChatJoined);
            socketService.off('chatNotFound', onChatNotFound);
            socketService.off('chatHistory', onChatHistory);
            socketService.off('newMessage', onNewMessage);
            socketService.off('messagesMarkedRead', onMessagesMarkedRead);
            socketService.off('error', onSocketError);
            socketService.disconnect();
        };
    }, [navigate]);

    // Fetch Job Details
    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await jobsAPI.getJobById(jobId);

                if (response.success && response.data) {
                    const jobData = response.data;
                    setJob(jobData);
                } else {
                    setError('Job not found');
                }
            } catch (err) {
                setError('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJobDetails();
        }
    }, [jobId]);

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('en-AU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Check if cleaner is on waitlist on load
    useEffect(() => {
        if (!job || !effectiveCleanerId) {
            setWaitlistNotice(null);
            return;
        }

        const normalizedCleanerId = effectiveCleanerId?.toString();
        const myWaitlistInfo = (job.waitlistedCleaners || []).find(w => {
            const wId = w?.cleanerId?._id || w?.cleanerId?.id || w?.cleanerId || (typeof w === 'string' ? w : null);
            return wId?.toString() === normalizedCleanerId;
        });

        const isWaitlisted = Boolean(myWaitlistInfo || job.isWaitlisted);
        if (!isWaitlisted) {
            setWaitlistNotice(null);
            return;
        }

        const position = myWaitlistInfo
            ? (job.waitlistedCleaners || []).findIndex(w => {
                const wId = w?.cleanerId?._id || w?.cleanerId?.id || w?.cleanerId || (typeof w === 'string' ? w : null);
                return wId?.toString() === normalizedCleanerId;
            }) + 1
            : undefined;

        const unlocksAt = job.createdAt
            ? new Date(new Date(job.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
            : null;

        setWaitlistNotice({
            position: position,
            unlocksAt: unlocksAt
        });
    }, [job, effectiveCleanerId]);

    // Check if cleaner has submitted quote for this job
    useEffect(() => {
        const checkExistingQuote = async () => {
            if (jobId && effectiveCleanerId) {
                try {
                    // First try to get job details with quotes
                    const response = await jobsAPI.getJobById(jobId);
                    if (response.success && response.data) {
                        const job = response.data;
                        
                        // Check if this cleaner has a quote for this job
                        if (job.quotes && job.quotes.length > 0) {
                            const myQuoteData = job.quotes.find(quote => {
                                // Handle different cleanerId formats safely
                                if (!quote.cleanerId) return false;
                                
                                // If cleanerId is a string
                                if (typeof quote.cleanerId === 'string') {
                                    return quote.cleanerId === effectiveCleanerId;
                                }
                                
                                // If cleanerId is an object
                                if (typeof quote.cleanerId === 'object') {
                                    return quote.cleanerId._id === effectiveCleanerId ||
                                           quote.cleanerId.id === effectiveCleanerId;
                                }
                                
                                return false;
                            });
                            
                            if (myQuoteData) {
                                setHasSubmittedQuote(true);
                                setQuoteStatus(myQuoteData.status);
                                setMyQuote(myQuoteData);
                                setQuoteAmount(myQuoteData.price.toString());
                            }
                        }
                    }
                    
                    // Fallback: Try to get cleaner's quotes directly
                    try {
                        const cleanerQuotesResponse = await quotesAPI.getCleanerQuotes();
                        if (cleanerQuotesResponse.success && cleanerQuotesResponse.data) {
                            const existingQuote = cleanerQuotesResponse.data.find(quote => 
                                quote.jobId === jobId || quote.jobId._id === jobId
                            );
                            
                            if (existingQuote) {
                                setHasSubmittedQuote(true);
                                setQuoteStatus(existingQuote.status);
                                setMyQuote(existingQuote);
                                setQuoteAmount(existingQuote.price.toString());
                            }
                        }
                    } catch (fallbackErr) {
                        // Silently handle fallback failure
                    }
                    
                } catch (err) {
                    // Silently handle quote check errors
                }
            }
        };

        checkExistingQuote();
    }, [jobId, effectiveCleanerId]);

    // Load chat history via REST API as fallback
    useEffect(() => {
        const loadChatHistoryFallback = async () => {
            if (jobId && effectiveCleanerId) {
                try {
                    // Try to get chat history via REST API
                    const response = await chatAPI.getChatHistory(jobId, effectiveCleanerId);
                    
                    if (response.success && response.data?.messages) {
                        setMessages(response.data.messages);
                        setIsLoadingMessages(false);
                    }
                } catch (error) {
                    // Silently handle error
                    setIsLoadingMessages(false);
                }
            }
        };

        // Try to load chat history immediately and also after a delay
        loadChatHistoryFallback();
        const timeoutId = setTimeout(loadChatHistoryFallback, 2000);
        const timeoutId2 = setTimeout(loadChatHistoryFallback, 5000);
        const loadingTimeout = setTimeout(() => setIsLoadingMessages(false), 10000);
        return () => {
            clearTimeout(timeoutId);
            clearTimeout(timeoutId2);
            clearTimeout(loadingTimeout);
        };
    }, [jobId, effectiveCleanerId]);

    // Join Chat Room - Direct access now
    useEffect(() => {
        if (jobId && effectiveCleanerId && isConnected) {
            // Find my info in contactedCleaners to get chatRoomId
            const myInfo = job?.contactedCleaners?.find(c => 
                (c.cleanerId?._id || c.cleanerId) === effectiveCleanerId
            );

            if (myInfo?.chatRoomId) {
                setCurrentChatRoom({ chatRoomId: myInfo.chatRoomId });
                chatRoomIdRef.current = myInfo.chatRoomId;
                socketService.joinRoom(myInfo.chatRoomId);
            } else {
                socketService.joinChat(jobId, effectiveCleanerId);
            }
        } else if (!effectiveCleanerId) {
            // If no effectiveCleanerId, initialize as empty
            setMessages([]);
        }
    }, [jobId, effectiveCleanerId, isConnected, job]);

    // Automatically fetch job details but remove quote modal logic
    useEffect(() => {
        // Modal is now removed
    }, []);

    // Mark messages as read when chat is viewed
    useEffect(() => {
        if (currentChatRoom?.chatRoomId && messages.length > 0) {
            // Check if there are unread messages from the OTHER user
            const hasUnreadFromOther = messages.some(msg => {
                const isSentByMe = msg.senderId?._id === (currentUser?.id || currentUser?._id) || 
                                  msg.senderId === (currentUser?.id || currentUser?._id);
                return !isSentByMe && !msg.isRead;
            });

            if (hasUnreadFromOther) {
                console.log('📖 [COMPONENT] Marking messages as read...');
                socketService.markAsRead(currentChatRoom.chatRoomId);
            }
        }
    }, [currentChatRoom, messages, currentUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (newMessage.trim()) {
            const messageContent = newMessage.trim();
            const tempMessage = {
                _id: `temp-${Date.now()}`,
                id: `temp-${Date.now()}`,
                senderId: { _id: currentUser?.id || currentUser?._id || 'cleaner' },
                content: messageContent,
                message: messageContent,
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
                // Optimistically add to state
                setMessages(prev => [...prev, tempMessage]);
                socketService.sendMessage(currentChatRoom.chatRoomId, messageContent);
                setNewMessage('');
            } else {
                // Room doesn't exist? Try to initiate contact via API
                try {
                    // Show message optimistically
                    setMessages(prev => [...prev, { ...tempMessage, isOptimistic: false }]);
                    setNewMessage('');
                    
                    if (isSubscriptionExpired) {
                        setError('Your subscription has expired. Please renew your plan to connect with new customers.');
                        setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
                        navigate('/my-subscription');
                        return;
                    }

                    const response = await jobsAPI.contactJob(jobId, { message: messageContent });
                    if (response.success) {
                        // After contact, refresh to get room info if possible, or wait for socket
                        const updatedJob = await jobsAPI.getJobById(jobId);
                        if (updatedJob.success && updatedJob.data) {
                            setJob(updatedJob.data);
                        }
                    } else {
                        setError(response.message || 'Failed to send message');
                    }
                } catch (err) {
                    console.error('Error initiating contact:', err);
                    // Fallback to local only for demo if offline
                    setError('Failed to connect to chat server. Message shown locally.');
                }
            }
            scrollToBottom();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendQuote = async () => {
        if (quoteAmount.trim()) {
            const price = parseFloat(quoteAmount);
            
            // Validate price
            if (price <= 0 || isNaN(price)) {
                setError('Please enter a valid budget amount');
                return;
            }
            
            setIsSubmittingQuote(true);
            try {
                let response;
                
                // Check if updating existing quote or submitting new one
                if (hasSubmittedQuote && myQuote?._id && (quoteStatus === 'pending' || quoteStatus === 'accepted')) {
                    // Update existing quote (pending or accepted if negotiable is ON)
                    response = await quotesAPI.updateQuote(myQuote._id, {
                        price
                    });
                } else if (hasSubmittedQuote && quoteStatus === 'rejected') {
                    // Quote is rejected, cannot update
                    setError('Cannot update quote - Quote has been rejected. Please contact customer directly.');
                    setIsSubmittingQuote(false);
                    return;
                } else {
                    // Submit new quote - backend will set availability automatically
                    response = await quotesAPI.submitQuote(jobId, {
                        price
                    });
                }

                if (response.success) {
                    // Check if this is an update or new submission
                    const isUpdate = hasSubmittedQuote && myQuote?._id && (quoteStatus === 'pending' || quoteStatus === 'accepted');
                    
                    setHasSubmittedQuote(true);
                    setQuoteStatus(response.data.status || 'pending');
                    setMyQuote(response.data);
                    
                    // Add quote message to chat
                    const messageText = isUpdate 
                        ? `Quote updated: $${price}${isNegotiable ? ' (negotiable)' : ''}`
                        : `Quote submitted: $${price}${isNegotiable ? ' (negotiable)' : ''}`;
                    
                    if (currentChatRoom?.chatRoomId && isConnected) {
                        // Cleaner sends only price in quote
                        socketService.sendQuote(
                            currentChatRoom.chatRoomId,
                            price,
                            messageText
                        );
                        
                        // Also send a regular text message to ensure it appears in chat
                        socketService.sendMessage(currentChatRoom.chatRoomId, messageText);
                    } else {
                        const quoteMessage = {
                            _id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            senderId: { _id: currentUser?.id || currentUser?._id },
                            content: messageText,
                            messageType: 'quote',
                            quoteData: {
                                price
                            },
                            createdAt: new Date().toISOString(),
                            time: new Date().toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            }).toLowerCase()
                        };
                        setMessages(prev => [...prev, quoteMessage]);
                        
                        // Also add a regular text message to ensure it appears
                        const textMessage = {
                            _id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            senderId: { _id: currentUser?.id || currentUser?._id },
                            content: messageText,
                            messageType: 'text',
                            createdAt: new Date().toISOString(),
                            time: new Date().toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            }).toLowerCase()
                        };
                        
                        setMessages(prev => [...prev, textMessage]);
                    }

                    setSentQuote({
                        base: price,
                        addOns: [],
                        total: price,
                        isNegotiable
                    });
                    
                    setShowBudgetModal(false);
                    setQuoteAmount('');
                    setError('');
                } else {
                    setError(response.error || response.message || 'Failed to submit quote');
                }
            } catch (err) {
                setError('Failed to submit quote. Please try again.');
            } finally {
                setIsSubmittingQuote(false);
            }
        }
    };

    const handleWithdrawBid = () => {
        setShowWithdrawModal(true);
    };

    const handleConfirmWithdraw = async () => {
        setIsWithdrawing(true);
        try {
            if (myQuote?._id) {
                const response = await quotesAPI.withdrawQuote(myQuote._id);
                
                if (response.success) {
                    // Reset quote states
                    setHasSubmittedQuote(false);
                    setQuoteStatus('pending');
                    setMyQuote(null);
                    setQuoteAmount('');
                    setSentQuote(null);
                    
                    // Navigate back to jobs page
                    navigate('/cleaner-jobs');
                } else {
                    setError(response.error || 'Failed to withdraw bid');
                }
            }
        } catch (err) {
            setError('Failed to withdraw bid. Please try again.');
        } finally {
            setIsWithdrawing(false);
            setShowWithdrawModal(false);
        }
    };

    const handleCancelWithdraw = () => {
        setShowWithdrawModal(false);
    };

    const getJobTitle = (job) => {
        if (!job) return 'Job Chat';
        
        if (job.customerId) {
            const firstName = job.customerId.firstName || '';
            const lastName = job.customerId.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) return fullName;
        }

        const serviceType = job.serviceTypeDisplay || (job.serviceType?.charAt(0).toUpperCase() + job.serviceType?.slice(1)) || 'Service';
        return `${serviceType}`;
    };

    if (loading) {
        return (
            <>
                <div className="max-w-sm mx-auto min-h-screen sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
                    <div className="p-4 sm:p-6 lg:p-8">
                        <Loader message="Loading chat..." />
                    </div>
                </div>
            </>
        );
    }

    if (error || !job) {
        return (
            <>
                <div className="max-w-sm mx-auto min-h-screen sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
                    <div className="p-4 sm:p-6 lg:p-8">
                        <div className="text-red-500 text-lg font-medium">{error || 'Job not found'}</div>
                        <Button onClick={() => navigate(-1)}>Go Back</Button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-90px)] px-4 md:px-8 overflow-hidden">
            <div className="max-w-7xl w-full mx-auto py-2 flex-shrink-0 capitalize">
                <PageHeader title={getJobTitle(job)} onBack={() => navigate(-1)} />
            </div>

            <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 bg-white rounded-2xl shadow-custom overflow-hidden mb-2">
                {/* Cost Warning Banner when not connected yet */}
                {!isContacted && (
                    <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 text-xs text-amber-700 text-center flex items-center justify-center gap-2 flex-shrink-0">
                        <img src={InfoIcon} alt="Info" className="w-3.5 h-3.5" />
                        <span>Sending your first message will deduct {subscriptionStatus?.subscription?.planId?.creditsPerLead || 20} credits from your balance.</span>
                    </div>
                )}
                {/* Error Message */}
                {error && (
                    <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg mx-4 mt-4 flex-shrink-0">
                        {error}
                    </div>
                )}

                {waitlistNotice && (
                    <div className="px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg mx-4 mt-4 flex-shrink-0">
                        <div className="font-semibold text-blue-800">You are waitlisted</div>
                        <div className="text-xs text-blue-600 mt-1">
                            {waitlistNotice.position ? `Position: ${waitlistNotice.position}. ` : ''}
                            {waitlistNotice.unlocksAt ? `Waitlist unlocks at ${formatDateTime(waitlistNotice.unlocksAt)}.` : ''}
                        </div>
                    </div>
                )}

                {/* Safety Banner */}
              

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    <div className="space-y-4">
                        {isLoadingMessages && (
                            <div className="py-4">
                                <Loader message="Loading chat..." />
                            </div>
                        )}
                        {messages.map((message, index) => {
                            const isSentByCurrentUser = message.senderId?._id === currentUser?.id || message.senderId?._id === currentUser?._id;
                            const messageTime = message.createdAt ? 
                                new Date(message.createdAt).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                }).toLowerCase() : 
                                message.time || '';

                            const uniqueKey = message._id || message.id || `msg-${index}-${message.content?.slice(0, 10) || 'empty'}`;
                            
                            if (message.messageType === 'system') {
                                const isRejectedMessage = message.content?.includes('rejected');
                                const bgColor = isRejectedMessage ? 'bg-red-500' : 'bg-green-500';
                                const borderColor = isRejectedMessage ? 'border-red-500' : 'border-green-500';
                                const textColor = 'text-white';
                                
                                return (
                                    <div key={uniqueKey} className="flex justify-center my-4">
                                        <div className={`${bgColor} border ${borderColor} ${textColor} px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-center max-w-md`}>
                                            {message.content || message.message}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={uniqueKey}
                                    className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex items-start space-x-2 max-w-xs sm:max-w-md lg:max-w-lg ${isSentByCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        {!isSentByCurrentUser && (
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <img src={UserIcon} alt="Customer" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col">
                                        {message.messageType === 'quote' && message.quoteData && (
                                            <div className={`px-4 py-3 rounded-2xl font-medium mb-2 ${
                                                isSentByCurrentUser
                                                    ? 'bg-[#F9FAFB] text-primary-500 border border-primary-200'
                                                    : 'bg-[#EBF2FD] text-primary-500'
                                            }`}>
                                                <div className="text-sm font-semibold text-primary-500 mb-2">💰 Quote Update</div>
                                                <div className="text-sm space-y-1">
                                                    <div>Price: <span className="font-semibold">${message.quoteData.price}</span></div>
                                                    {message.quoteData.estimatedDuration && (
                                                        <div>Duration: <span className="font-semibold">{message.quoteData.estimatedDuration}</span></div>
                                                    )}
                                                    {message.quoteData.availability && (
                                                        <div>Available: <span className="font-semibold">
                                                            {new Date(message.quoteData.availability).toLocaleDateString()}
                                                        </span></div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {message.messageType === 'budget_update' && message.budgetData && (
                                            <div className={`px-4 py-3 rounded-2xl font-medium mb-2 ${
                                                isSentByCurrentUser
                                                    ? 'bg-[#F9FAFB] text-primary-500 border border-primary-200'
                                                    : 'bg-[#EBF2FD] text-primary-500'
                                            }`}>
                                                <div className="text-sm font-semibold text-primary-500 mb-2">💵 Budget Update</div>
                                                <div className="text-sm space-y-1">
                                                    <div>Amount: <span className="font-semibold">${message.budgetData.amount}</span></div>
                                                    <div>Status: <span className="font-semibold">
                                                        {message.budgetData.isNegotiable ? 'Negotiable' : 'Fixed'}
                                                    </span></div>
                                                </div>
                                            </div>
                                        )}

                                        {(message.content || message.message) && (
                                            <div
                                                className={`px-4 py-3 rounded-2xl font-medium ${
                                                    isSentByCurrentUser
                                                        ? 'bg-[#F9FAFB] text-primary-500 border border-primary-200'
                                                        : 'bg-[#EBF2FD] text-primary-500'
                                                }`}
                                            >
                                                <p className="text-sm">{message.content || message.message}</p>
                                                <p className="text-xs mt-1 text-primary-200">
                                                    {messageTime}
                                                </p>
                                                {isSentByCurrentUser && (
                                                    <div className="flex justify-end mt-1">
                                                        <span className={`text-[10px] font-bold ${message.isRead ? 'text-green-500' : 'text-gray-400'}`}>
                                                            {message.isRead ? '✓✓' : '✓'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        </div>
                                        
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
                </div>

                {/* Message Input */}
                <div className="bg-white px-4 py-3 sm:px-6 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Message..."
                            className="flex-1 px-4 py-3 rounded-full text-sm focus:outline-none border shadow-custom bg-[#F9FAFB] border-primary-200"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className={`cursor-pointer ${!newMessage.trim() ? 'opacity-50' : ''}`}
                        >
                            <img src={SendIcon} alt="Send" className="w-10 h-10" />
                        </button>
                    </div>
                                     {/* Withdraw Request Button - Show only when contacted but not connected */}
                     {hasSubmittedQuote && quoteStatus === 'pending' && !isConnected && (
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={handleWithdrawBid}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors cursor-pointer text-sm flex items-center justify-center"
                                    >
                                        <img src={WithdrawIcon} alt="Withdraw" className="w-4 h-4 mr-2" />
                                        Withdraw Request
                                    </button>
                                </div>
                            )}
                </div>
            </div>

            {/* Withdraw Bid Confirmation Modal */}
            <ConfirmationModal
                isOpen={showWithdrawModal}
                onClose={handleCancelWithdraw}
                onConfirm={handleConfirmWithdraw}
                title="Withdraw Request"
                message="Are you sure you want to withdraw your request? You will need to contact the customer again if you change your mind."
                confirmText="Withdraw"
                cancelText="Cancel"
                confirmButtonColor="bg-red-500 hover:bg-red-600"
                isLoading={isWithdrawing}
            />

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
    );
};

export default CleanerChatPage;
