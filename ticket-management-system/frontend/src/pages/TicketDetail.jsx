import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../../services/api';
import { FiEdit, FiTrash2, FiUser, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const fetchTicket = async () => {
    try {
      const { data } = await ticketAPI.getTicket(id);
      setTicket(data.data.ticket);
      setComments(data.data.comments);
      setActivities(data.data.activities);
      setEditData(data.data.ticket);
    } catch (error) {
      toast.error('Failed to fetch ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      // In a real app, you would have a comment API endpoint
      toast.success('Comment added (demo)');
      setNewComment('');
      fetchTicket();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleUpdateTicket = async () => {
    try {
      await ticketAPI.updateTicket(id, editData);
      toast.success('Ticket updated');
      setIsEditing(false);
      fetchTicket();
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      await ticketAPI.deleteTicket(id);
      toast.success('Ticket deleted');
      navigate('/tickets');
    } catch (error) {
      toast.error('Failed to delete ticket');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ticket.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            #{ticket._id.slice(-6)} • Created by {ticket.createdBy?.name} • {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          {hasRole(['admin', 'agent']) && (
            <>
              <button onClick={() => setIsEditing(!isEditing)} className="btn-secondary flex items-center space-x-2">
                <FiEdit />
                <span>Edit</span>
              </button>
              {hasRole('admin') && (
                <button onClick={handleDeleteTicket} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <FiTrash2 />
                  <span>Delete</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Description</h2>
            {isEditing ? (
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="input-field min-h-[150px]"
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{ticket.description}</p>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Comments ({comments.length})</h2>
            
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment._id} className="border-b border-gray-200 dark:border-dark-border pb-4 last:border-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm">
                      {comment.author?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{comment.author?.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 ml-10">{comment.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmitComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="input-field min-h-[100px] mb-2"
              />
              <button type="submit" className="btn-primary">Post Comment</button>
            </form>
          </div>

          {/* Activity Log */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity Log</h2>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity._id} className="flex items-start space-x-3">
                  <FiClock className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {activity.user?.name} • {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ticket Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                {isEditing ? (
                  <select
                    value={editData.status || ''}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="input-field mt-1"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{ticket.status.replace('_', ' ')}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Priority</label>
                {isEditing ? (
                  <select
                    value={editData.priority || ''}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                    className="input-field mt-1"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                ) : (
                  <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{ticket.priority}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Category</label>
                <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{ticket.category.replace('_', ' ')}</p>
              </div>

              {ticket.assignedTo && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Assigned To</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <FiUser className="text-gray-400" />
                    <p className="font-medium text-gray-900 dark:text-gray-100">{ticket.assignedTo.name}</p>
                  </div>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="mt-4 flex space-x-2">
                <button onClick={handleUpdateTicket} className="btn-primary flex-1">Save</button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
