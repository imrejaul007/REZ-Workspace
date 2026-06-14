'use client';

import { useCallback, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useThermalPrinter } from '@/lib/hooks/useThermalPrinter';
import { buildReceipt, ReceiptData } from '@/lib/utils/escpos';
import { useUIStore } from '@/lib/store/uiStore';
import { WebOrder } from '@/lib/types';

interface PrintReceiptProps {
  /** The order to print */
  order: WebOrder;
  /** 'receipt' = customer receipt (full details, QR code)
   *  'kot' = kitchen order ticket (items only, no prices) */
  variant?: 'receipt' | 'kot';
  /** Override the store name shown on the receipt */
  storeName?: string;
  /** Extra CSS class */
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'Select Printer',
  discovering: 'Finding Printers...',
  connecting: 'Connecting...',
  printing: 'Printing...',
  error: 'Print Failed',
};

export default function PrintReceipt({
  order,
  variant = 'receipt',
  storeName,
  className = '',
}: PrintReceiptProps) {
  const { showToast } = useUIStore();
  const printer = useThermalPrinter();

  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Build the receipt bytes and attempt to print.
   */
  const handlePrint = useCallback(async () => {
    setIsLoading(true);

    try {
      // Build receipt data
      const receiptData: ReceiptData = {
        storeName: storeName ?? order.storeName ?? 'Store',
        orderNumber: order.orderNumber ?? order.id?.slice(-6) ?? 'N/A',
        createdAt: order.createdAt,
        items: (order.items ?? []).map((item) => ({
          name: item.name ?? 'Item',
          qty: item.quantity ?? 1,
          price: item.price ?? 0,
        })),
        subtotal: order.subtotal ?? 0,
        tax: order.gst ?? 0,
        total: order.total ?? 0,
         
        paymentId: (order as unknown as { paymentId?: string; razorpayPaymentId?: string }).paymentId ?? (order as unknown as { paymentId?: string; razorpayPaymentId?: string }).razorpayPaymentId,
         
        customerName: (order as unknown as { customerName?: string; name?: string }).customerName ?? (order as unknown as { customerName?: string; name?: string }).name,
        tableNumber: order.tableNumber ?? undefined,
        variant,
      };

      const bytes = buildReceipt(receiptData);
      const success = await printer.printReceipt(bytes);

      if (success) {
        showToast(variant === 'kot' ? 'Kitchen ticket sent to printer' : 'Receipt sent to printer', 'success');
        setShowDialog(false);
      } else if (printer.status === 'error') {
        showToast(printer.errorMessage ?? 'Print failed', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Print failed', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [order, variant, storeName, printer, showToast]);

  /**
   * Open Bluetooth picker and print.
   */
  const handleDiscover = useCallback(async () => {
    const connected = await printer.discoverPrinter();
    if (connected) {
      await handlePrint();
    }
  }, [printer, handlePrint]);

  const currentStatus = printer.status === 'idle' && printer.isConnected ? 'idle' : printer.status;
  const buttonLabel = printer.isConnected
    ? variant === 'kot'
      ? 'Print KOT'
      : 'Print Receipt'
    : STATUS_LABELS[currentStatus] ?? 'Select Printer';

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowDialog(true)}
        className={className}
        disabled={printer.status === 'discovering' || printer.status === 'connecting'}
      >
        {variant === 'kot' ? '🖨 KOT' : '🖨 Receipt'}
      </Button>

      {/* Print Dialog */}
      <Modal
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={variant === 'kot' ? 'Print Kitchen Order Ticket' : 'Print Receipt'}
      >
        <div className="space-y-4 p-1">
          {/* Printer status */}
          <div className="rounded border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Printer</span>
              <span
                className={`text-xs ${
                  printer.isConnected
                    ? 'text-green-600'
                    : printer.status === 'error'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {printer.isConnected
                  ? `Connected${printer.device?.name ? ` (${printer.device.name})` : ''}`
                  : 'Not connected'}
              </span>
            </div>

            {printer.status === 'error' && printer.errorMessage && (
              <p className="mt-1 text-xs text-red-500">{printer.errorMessage}</p>
            )}
          </div>

          {/* Order summary */}
          <div className="rounded border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500">
              {variant === 'kot' ? 'Kitchen Order Ticket' : 'Customer Receipt'}
            </p>
            <p className="mt-1 text-sm font-semibold">
              Order #{order.orderNumber ?? order.id?.slice(-6)}
            </p>
            <p className="text-xs text-gray-500">
              {order.items?.length ?? 0} item(s)
              {variant === 'receipt' && (
                <> &mdash; Rs {(order.total ?? 0).toFixed(2)}</>
              )}
            </p>
          </div>

          {/* Bluetooth info */}
          {!printer.isBluetoothAvailable && (
            <p className="rounded bg-amber-50 p-2 text-xs text-amber-700">
              Web Bluetooth is not available in this browser. Click Print to use the browser
              print dialog.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDialog(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>

            {!printer.isConnected ? (
              <Button
                variant="primary"
                onClick={handleDiscover}
                disabled={isLoading || printer.status === 'discovering'}
                className="flex-1"
              >
                {printer.status === 'discovering' ? 'Finding...' : 'Find Printer'}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handlePrint}
                disabled={isLoading || printer.status === 'printing'}
                className="flex-1"
              >
                {isLoading || printer.status === 'printing' ? 'Printing...' : buttonLabel}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
