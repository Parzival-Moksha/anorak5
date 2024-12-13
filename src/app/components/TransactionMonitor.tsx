interface TransactionMonitorProps {
  detectedTrigger: boolean;
  transactionStatus: {
    state: 'idle' | 'signing' | 'processing' | 'confirmed' | 'error';
    message: string;
  };
}

const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  detectedTrigger,
  transactionStatus,
}) => {
  return (
    <div className="text-center">
      {detectedTrigger ? (
        <div className="text-green-400">You won the heart of Sooka</div>
      ) : (
        <div className="text-white/30">Secret unclaimed</div>
      )}
      {/* Transaction Status Message */}
      <div className="mt-2 text-sm text-white/50">
        {transactionStatus.message}
      </div>
    </div>
  );
};

export default TransactionMonitor; 