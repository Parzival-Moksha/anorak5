type LogLevel = 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  error?: Error;
  timestamp: string;
}

// Create a type-safe console wrapper
const safeConsole = {
  log: Function.prototype.bind.call(console.log, console),
  warn: Function.prototype.bind.call(console.warn, console),
  error: Function.prototype.bind.call(console.error, console)
} as const;

// Create formatted log messages
const formatLogMessage = (level: string, message: string, errorMsg?: string): string => {
  const formattedMsg = `[${level.toUpperCase()}] ${message}`;
  return errorMsg ? `${formattedMsg} - ${errorMsg}` : formattedMsg;
};

export const logger = {
  info: (message: string) => {
    log('info', message);
  },
  warn: (message: string, error?: Error) => {
    log('warn', message, error);
  },
  error: (message: string, error?: Error) => {
    log('error', message, error);
  }
};

function log(level: LogLevel, message: string, error?: Error) {
  const logMessage: LogMessage = {
    level,
    message,
    error,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    const formattedMessage = formatLogMessage(level, message, error?.message);
    
    switch (level) {
      case 'info':
        safeConsole.log(formattedMessage);
        break;
      case 'warn':
        safeConsole.warn(formattedMessage);
        break;
      case 'error':
        safeConsole.error(formattedMessage);
        break;
    }
  } else {
    // Production logging
    // TODO: Implement production logging service
  }
} 