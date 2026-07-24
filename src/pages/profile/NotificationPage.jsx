import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Loader } from '../../components'
import { notificationsAPI, handleAPIError } from '../../services/api'

const NotificationPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getNotifications()
      if (response.success) {
        setNotifications(response.data || [])
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      }
    } catch (error) {
      console.error(handleAPIError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    const notificationId = notification?._id || notification?.id;
    try {
      if (!notification.isRead && notificationId) {
        await notificationsAPI.markAsRead(notificationId)
        // Update local state
        setNotifications(prev => 
          prev.map(n => (n._id === notificationId || n.id === notificationId) ? { ...n, isRead: true } : n)
        )
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getActionText = (type) => {
    switch (type?.toLowerCase()) {
      case 'job':
        return 'View Job'
      case 'payment':
        return 'View Earnings'
      case 'admin':
        return 'Update Now'
      case 'training':
        return 'View Training'
      default:
        return 'View Details'
    }
  }

  const handleActionClick = async (e, notification) => {
    e.stopPropagation()
    const notificationId = notification?._id || notification?.id
    const actionLink = notification?.actionLink
    
    // Mark as read if not already read
    if (!notification.isRead && notificationId) {
      try {
        await notificationsAPI.markAsRead(notificationId)
        setNotifications(prev => 
          prev.map(n => (n._id === notificationId || n.id === notificationId) ? { ...n, isRead: true } : n)
        )
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      } catch (error) {
        console.error('Error marking as read:', error)
      }
    }

    // Redirect
    if (actionLink) {
      if (actionLink.startsWith('/')) {
        navigate(actionLink)
      } else {
        window.open(actionLink, '_blank')
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  if (loading) {
    return <Loader fullscreen message="Loading notifications..." />
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
        <PageHeader
          title="Notifications"
          onBack={() => navigate(-1)}
          className="py-4"
          rightSlot={
            notifications.some(n => !n.isRead) && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
              >
                Mark all as read
              </button>
            )
          }
        />

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-custom overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-500 text-sm sm:text-base">No notifications found</div>
            </div>
          ) : (
            <div className="space-y-3 mx-3">
              {notifications.map((notification) => (
                <div
                  key={notification?._id || notification?.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={"p-4 sm:p-5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-[#F3F3F3] rounded-lg "}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1 sm:mb-2">
                        <h3 className={`text-sm sm:text-base font-semibold text-primary-500 line-clamp-2 ${
                          !notification.isRead ? 'font-bold' : ''
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 ml-2"></div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-primary-200 font-medium mb-2 sm:mb-3 line-clamp-2">
                        {notification.body || notification.description || notification.message}
                      </p> 
                      <div className="flex items-center justify-between">
                        {/* {notification.actionLink && (
                          <button
                            onClick={(e) => handleActionClick(e, notification)}
                            className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-semibold cursor-pointer"
                          >
                            {getActionText(notification.type)}
                          </button>
                        )} */}
                        <span className="text-xs text-primary-200 font-medium ml-auto">
                          {notification.timestamp || (notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationPage
