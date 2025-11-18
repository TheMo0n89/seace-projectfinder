import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import axios from 'axios';
import { ErrorAlert } from '../ui/Alert';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const Chatbot = ({ onClose }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [usePersonalization, setUsePersonalization] = useState(false);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_sessions: 0, remaining_slots: 5 });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSessions();
    loadStats();
  }, []);

  // Cargar mensajes cuando cambia la sesión activa
  useEffect(() => {
    if (activeSession) {
      loadSessionMessages(activeSession.id);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  const loadSessionMessages = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sessionMessages = response.data.data.session.messages || [];
      const formattedMessages = [];
      
      sessionMessages.forEach(msg => {
        formattedMessages.push({
          id: `user-${msg.id}`,
          type: 'user',
          content: msg.user_query,
          timestamp: msg.created_at
        });
        formattedMessages.push({
          id: `bot-${msg.id}`,
          type: 'bot',
          content: msg.ai_response,
          metadata: { processes: msg.relevant_processes },
          timestamp: msg.created_at
        });
      });
      
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data.data.sessions || []);
      
      // Si no hay sesión activa, crear una
      if (!activeSession && response.data.data.sessions.length === 0) {
        await createNewSession();
      } else if (!activeSession && response.data.data.sessions.length > 0) {
        setActiveSession(response.data.data.sessions[0]);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const createNewSession = async () => {
    try {
      if (stats.remaining_slots === 0) {
        alert('Has alcanzado el límite de 5 chats. Elimina uno para crear otro.');
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/chat/sessions`, 
        { title: 'Nuevo Chat' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newSession = response.data.data.session;
      setSessions([newSession, ...sessions]);
      setActiveSession(newSession);
      await loadStats();
    } catch (err) {
      if (err.response?.data?.code === 'MAX_SESSIONS_REACHED') {
        alert(err.response.data.message);
      } else {
        console.error('Error creating session:', err);
      }
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm('¿Eliminar este chat?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/chat/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      
      if (activeSession?.id === sessionId) {
        setActiveSession(newSessions[0] || null);
      }
      
      await loadStats();
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const updateSessionTitle = async (sessionId, newTitle) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/chat/sessions/${sessionId}/title`,
        { title: newTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, title: newTitle } : s
      ));
      setEditingSessionId(null);
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading || !activeSession) return;

    const message = inputMessage.trim();
    setInputMessage('');
    
    // Agregar mensaje del usuario inmediatamente
    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Enviar consulta al chatbot con o sin personalización
      const chatResponse = await axios.post(
        `${API_URL}/chatbot/query`,
        { 
          query: message,
          use_personalization: usePersonalization 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiResponse = chatResponse.data.data.response || 'Sin respuesta';
      const relevantProcesses = chatResponse.data.data.metadata?.process_ids || [];

      // Agregar mensaje de la IA
      const botMsg = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: aiResponse,
        metadata: { processes: relevantProcesses },
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);

      // Guardar en la base de datos
      await axios.post(
        `${API_URL}/chat/sessions/${activeSession.id}/messages`,
        {
          user_query: message,
          ai_response: aiResponse,
          relevant_processes: relevantProcesses,
          response_time_ms: chatResponse.data.data.metadata?.response_time || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Si es el primer mensaje, actualizar el título
      if (messages.length === 0 || activeSession.title === 'Nuevo Chat') {
        const autoTitle = message.split(' ').slice(0, 5).join(' ');
        await updateSessionTitle(activeSession.id, autoTitle);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error al enviar el mensaje. Intenta nuevamente.');
      
      // Mensaje de error
      const errorMsg = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.',
        error: true,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-lg shadow-2xl transition-all duration-300 ${
      isExpanded ? 'w-[700px] h-[85vh]' : 'w-96 h-[600px]'
    }`}>
      {/* Header con sesiones */}
      <div className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-sm">
              {activeSession ? activeSession.title : 'Asistente IA'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs opacity-90">
                {stats.remaining_slots} de 5 chats disponibles
              </p>
              {usePersonalization && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  ✨ Personalizado
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle Personalización */}
            <button
              onClick={() => setUsePersonalization(!usePersonalization)}
              className={`p-1.5 rounded-lg transition-all ${
                usePersonalization 
                  ? 'bg-white/30 hover:bg-white/40' 
                  : 'hover:bg-white/20'
              }`}
              title={usePersonalization ? 'Desactivar personalización' : 'Activar personalización con mi perfil'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? (
                <ArrowsPointingInIcon className="h-5 w-5" />
              ) : (
                <ArrowsPointingOutIcon className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={createNewSession}
              disabled={stats.remaining_slots === 0}
              className="p-1.5 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Nuevo chat"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Mis chats"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Cerrar"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
        </div>
        
        {/* Lista de sesiones */}
        {showSessions && (
          <div className="mt-2 bg-white rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center gap-2 p-2 hover:bg-gray-50 ${
                  activeSession?.id === session.id ? 'bg-blue-50' : ''
                }`}
              >
                {editingSessionId === session.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => {
                      if (editTitle.trim()) {
                        updateSessionTitle(session.id, editTitle.trim());
                      }
                      setEditingSessionId(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && editTitle.trim()) {
                        updateSessionTitle(session.id, editTitle.trim());
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm border rounded text-gray-900"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setActiveSession(session);
                      setShowSessions(false);
                    }}
                    className="flex-1 text-left px-2 py-1 text-sm text-gray-900 truncate"
                  >
                    {session.title}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setEditingSessionId(session.id);
                    setEditTitle(session.title);
                  }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600"
                  title="Editar"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => deleteSession(session.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                  title="Eliminar"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Welcome Message - Only show when no messages */}
      {messages.length === 0 && (
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-seace-blue to-seace-blue-dark rounded-xl flex items-center justify-center mx-auto mb-3">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">¡Hola! 👋</h3>
          <p className="text-sm text-gray-600 mb-4">
            Soy tu asistente IA para consultas SEACE. Puedo ayudarte con:
          </p>
          <div className="text-left space-y-2 text-xs text-gray-500 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-seace-blue rounded-full"></div>
              <span>Buscar procesos específicos</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-seace-green rounded-full"></div>
              <span>Recomendaciones de TI</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-seace-orange rounded-full"></div>
              <span>Análisis de licitaciones</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-seace-blue rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-seace-blue rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-seace-blue rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs text-gray-500">Pensando...</span>
              </div>
            </div>
          </div>
        )}
          
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-3 bg-gray-50/50">
        {error && (
          <ErrorAlert 
            error={error} 
            onDismiss={() => {}} 
            className="mb-3"
          />
        )}

        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pregunta sobre procesos SEACE..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-seace-blue/20 focus:border-seace-blue text-sm bg-white"
              rows={1}
              disabled={loading}
              style={{ minHeight: '36px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            className="p-2 bg-seace-blue text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-seace-blue-dark transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick suggestions */}
        <div className="mt-3 flex flex-wrap gap-2 max-h-20 overflow-y-auto">
          {[
            'Procesos de tecnología',
            'Licitaciones de software',
            'Contrataciones de sistemas',
            'Procesos de desarrollo',
            'Licitaciones activas',
            'Recomiéndame procesos SEACE',
            'Adjudicaciones recientes',
            'Procesos informática'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputMessage(suggestion)}
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-gray-700 rounded-full transition-all border border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.type === 'user';
  const isError = message.error;
  const navigate = useNavigate();

  // Componente personalizado para enlaces internos
  const LinkRenderer = ({ href, children }) => {
    // Detectar si es un enlace interno a procesos
    if (href && (href.startsWith('/procesos/') || href.startsWith('/process/'))) {
      const processId = href.split('/').pop();
      return (
        <Link 
          to={`/process/${processId}`}
          className="text-blue-600 hover:text-blue-800 underline font-medium"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {children}
        </Link>
      );
    }
    // Enlaces externos
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 bg-gradient-to-r from-seace-blue to-seace-blue-dark rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
          <span className="text-white text-xs font-semibold">AI</span>
        </div>
      )}
      
      <div className={`max-w-[280px] px-4 py-3 rounded-2xl ${
        isUser 
          ? 'bg-seace-blue text-white rounded-br-md' 
          : isError 
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
      } shadow-sm`}>
        <div className="text-sm leading-relaxed prose prose-sm max-w-none">
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{
                a: LinkRenderer,
                // Personalizar otros elementos
                h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="text-sm" {...props} />,
                p: ({node, ...props}) => <p className="my-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                code: ({node, inline, ...props}) => 
                  inline ? (
                    <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props} />
                  ) : (
                    <code className="block bg-gray-200 p-2 rounded text-xs my-2" {...props} />
                  )
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        
        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-300/50">
            <div className="text-xs text-gray-500 mb-1">📄 Fuentes:</div>
            <div className="space-y-1">
              {message.sources.slice(0, 2).map((source, index) => (
                <div key={index} className="flex items-center text-xs text-gray-600">
                  <span className="w-1 h-1 bg-seace-blue rounded-full mr-2"></span>
                  <span className="truncate">{source.title || source.codigo_proceso}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs opacity-60 mt-2">
          {new Date(message.timestamp).toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      {isUser && (
        <div className="w-7 h-7 bg-seace-green rounded-full flex items-center justify-center ml-2 mt-1 flex-shrink-0">
          <span className="text-white text-xs font-semibold">Tú</span>
        </div>
      )}
    </div>
  );
};
