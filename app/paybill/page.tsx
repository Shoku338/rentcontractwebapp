"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// Define a type for the processed bill group
type UnpaidBillGroup = {
  contractId: number;
  roomName: string;
  totalAmount: number;
  tenantName: string;
  billCount: number;
  bills: any[]; // Store original bills
};

type BillDetail = {
  Description: string;
  Amount: number;
};

export default function PayBill() {
  const [unpaidBills, setUnpaidBills] = useState<UnpaidBillGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBillGroup, setSelectedBillGroup] = useState<UnpaidBillGroup | null>(null);
  const [billDetails, setBillDetails] = useState<BillDetail[]>([]);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        setError(null);
        // More efficient: Request only unpaid bills from the API
        const res = await fetch("/api/Billing?Status=Unpaid");
        if (!res.ok) throw new Error("Failed to fetch billing data");

        const unpaid = await res.json();

        const billsByRoom = unpaid.reduce((acc: Record<string, UnpaidBillGroup>, bill: any) => {
          const roomName = bill.Contract?.Room?.RoomName ?? 'N/A';
          const tenant = bill.Contract?.tenants;
          const tenantName = tenant ? `${tenant.Firstname} ${tenant.Lastname}` : 'No Tenant';

          if (!acc[roomName]) {
            acc[roomName] = { roomName, totalAmount: 0, billCount: 0, tenantName, contractId: bill.ContractId, bills: [] };
          }
          acc[roomName].totalAmount += Number(bill.GrandTotal);
          acc[roomName].billCount += 1;
          acc[roomName].bills.push(bill);
          return acc;
        }, {});

        setUnpaidBills(Object.values(billsByRoom));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const filteredBills = useMemo(() => {
    if (!searchQuery) return unpaidBills;
    return unpaidBills.filter(bill =>
      bill.roomName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, unpaidBills]);

  const handleShowDetails = async (billGroup: UnpaidBillGroup) => {
    setSelectedBillGroup(billGroup);
    // For simplicity, we'll fetch details for the first bill in the group.
    // A more complex scenario might aggregate details from all unpaid bills.
    const firstBillId = billGroup.bills[0]?.id;
    if (firstBillId) {
      try {
        const res = await fetch(`/api/BillingDetails?BillingId=${firstBillId}`);
        const details = await res.json();
        setBillDetails(Array.isArray(details) ? details : []);
      } catch (e) {
        setBillDetails([]);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setPaymentProofFile(event.target.files[0]);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedBillGroup || !paymentProofFile) {
      alert("กรุณาแนบสลิปการชำระเงิน");
      return;
    }

    setIsConfirmingPayment(true);
    const supabase = createClient();

    try {
      // 1. Upload the image to Supabase Storage
      const fileExt = paymentProofFile.name.split('.').pop();
      const fileName = `${selectedBillGroup.contractId}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, paymentProofFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);

      const paymentProofURL = urlData.publicUrl;

      // 3. Update all unpaid bills for this group to 'Paid'
      const updatePromises = selectedBillGroup.bills.map(bill => 
        fetch('/api/Billing', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: bill.id,
            Status: 'Paid',
            PaymentProofURL: paymentProofURL,
          }),
        })
      );
      await Promise.all(updatePromises);

      alert("ยืนยันการชำระเงินสำเร็จ!");
      // Navigate to the rentbill page to see the updated status
      router.push('/rentbill');
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  return (
    <div className="bg-white min-h-screen p-6">

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">
          กรุณาพิมพ์ชื่อห้องที่ต้องการชำระเงิน
        </h1>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-6">
        <div className="flex items-center border border-gray-300 rounded px-3 py-2 bg-white">
          <span className="text-gray-500 mr-2">🔍</span>
          <input
            type="text"
            placeholder="ค้นหาตามหมายเลขห้อง"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full outline-none"
          />
        </div>
      </div>

      {/* Subtitle */}
      {!loading && !error && (
        <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-semibold text-gray-700 mb-4">
          รายการห้องค้างชำระ: {filteredBills.length} ห้อง
        </div>
      )}

      {/* Room List */}
      <div className="space-y-4">
        {loading && <p className="text-center text-gray-600">Loading...</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {!loading && !error && filteredBills.map((item, index) => (
          <div
            key={item.roomName}
            className="border border-gray-300 rounded overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-blue-900">{item.roomName}</span>
                <span className="text-sm text-gray-500">{item.tenantName}</span>
              </div>

              <button onClick={() => handleShowDetails(item)} className="bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 transition">
                รายละเอียด
              </button>
            </div>

            <div className="px-4 py-2 bg-white text-gray-700">
              ค้างชำระทั้งหมด{" "}
              <span className="font-bold text-red-600">
                {item.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
              </span>{" "}
              ({item.billCount} บิล)
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-2 mt-6">
        <button className="border px-4 py-1 rounded bg-white hover:bg-gray-100">
          หน้าก่อนหน้า
        </button>

        <button className="border px-4 py-1 rounded bg-blue-600 text-white">
          1
        </button>

        <button className="border px-4 py-1 rounded bg-white hover:bg-gray-100">
          หน้าถัดไป
        </button>
      </div>

      {/* Bill Details Modal */}
      {selectedBillGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">รายละเอียดบิล - ห้อง {selectedBillGroup.roomName}</h3>
              <button onClick={() => setSelectedBillGroup(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <div className="border-t pt-4">
              <ul className="space-y-2 mb-4">
                {billDetails.map((detail, index) => (
                  <li key={index} className="flex justify-between items-center text-gray-700">
                    <span>{detail.Description}</span>
                    <span className="font-mono">{detail.Amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </li>
                ))}
                {billDetails.length === 0 && <p>No details found.</p>}
              </ul>
              <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                <span>ยอดรวม</span>
                <span>
                  {selectedBillGroup.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                </span>
              </div>
            </div>
            <div className="border-t pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                แนบสลิปหลักฐานการชำระเงิน
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="mt-6 flex gap-2">
               <button 
                onClick={handleConfirmPayment}
                disabled={!paymentProofFile || isConfirmingPayment}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
               >
                {isConfirmingPayment ? 'กำลังดำเนินการ...' : 'ยืนยันชำระเงิน'}
              </button>
              <button onClick={() => setSelectedBillGroup(null)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
