"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  Download,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { generateSerials } from "@/services/api";
import type { Serial } from "@/services/api";

export default function GenerateSerialsPage() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(100);
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | "">("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSerials, setGeneratedSerials] = useState<Serial[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!productId.trim() || !productName.trim()) {
      setError("Product ID and Product Name are required");
      return;
    }

    if (quantity < 1 || quantity > 10000) {
      setError("Quantity must be between 1 and 10,000");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await generateSerials({
        productId: productId.trim(),
        productName: productName.trim(),
        quantity,
        prefix: prefix.trim() || undefined,
        expiresInDays: expiresInDays !== "" ? Number(expiresInDays) : undefined,
      });

      if (response.success && response.data) {
        setGeneratedSerials(response.data.serials);
        setBatchId(response.data.batchId);
      } else {
        setError(response.error || "Failed to generate serials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySerials = () => {
    const serialList = generatedSerials.map((s) => s.serialNumber).join("\n");
    navigator.clipboard.writeText(serialList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const headers = ["Serial Number", "QR Code", "Product ID", "Product Name", "Status", "Created At"];
    const rows = generatedSerials.map((s) => [
      s.serialNumber,
      s.qrCode,
      s.productId || "",
      s.productName || "",
      s.status,
      s.createdAt,
    ]);

    const csvContent =
      headers.join(",") + "\n" + rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `serials-${batchId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/serials"
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Generate Serials</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create new QR code serials for your products
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generate Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Serial Configuration
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product ID *
                </label>
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="e.g., PROD-001"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Premium Widget"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(10000, Number(e.target.value))))}
                min={1}
                max={10000}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Maximum 10,000 serials per batch
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Serial Prefix (optional)
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g., SPR-"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expires In (days, optional)
                </label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Leave empty for no expiry"
                  min={1}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Generate {quantity.toLocaleString()} Serials
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview / Results */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {generatedSerials.length > 0 ? "Generated Serials" : "Preview"}
          </h2>

          {generatedSerials.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Successfully generated {generatedSerials.length.toLocaleString()} serials
                </p>
                {batchId && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Batch ID: <span className="font-mono">{batchId}</span>
                  </p>
                )}
              </div>

              <div className="max-h-80 overflow-auto bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-1">
                  {generatedSerials.slice(0, 50).map((serial, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <code className="font-mono text-gray-900 dark:text-white">
                        {serial.serialNumber}
                      </code>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {serial.status}
                      </span>
                    </div>
                  ))}
                  {generatedSerials.length > 50 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                      ...and {generatedSerials.length - 50} more
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopySerials}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>

              <button
                onClick={() => {
                  setGeneratedSerials([]);
                  setBatchId(null);
                }}
                className="w-full px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Generate More
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Configure your serials and click Generate to see preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
