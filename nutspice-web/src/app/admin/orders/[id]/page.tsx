import React from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import OrderDetailClient from "./OrderDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

import { isAdminNumber } from "@/lib/admin";

async function checkAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session || !isAdminNumber(session)) {
    redirect("/admin/login");
  }
}

export default async function OrderDetailPage({ params }: PageProps) {
  // 1. Authenticate Admin
  await checkAdmin();

  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    return notFound();
  }

  // 2. Fetch Order details from Drizzle SQL
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (orderRows.length === 0) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-16 text-center font-sans">
        <div className="bg-white rounded-3xl border border-brand/5 shadow-md p-8">
          <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-playfair font-bold text-brand mb-2">Order Not Found</h2>
          <p className="text-brand/40 text-xs font-semibold mb-6">
            The order ID #00{orderId} could not be found in our database.
          </p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B3022] hover:bg-brand text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const order = orderRows[0];

  // 3. Fetch Purchased Order Items (joining with products to get product names)
  const items = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      size: orderItems.size,
      color: orderItems.color,
      customizations: orderItems.customizations,
      productName: products.name
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  // 4. Fetch customer details if order has userId associated
  let phone = "";
  
  if (order.userId) {
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);
    if (userRows.length > 0 && userRows[0].phoneNumber) {
      phone = userRows[0].phoneNumber;
    }
  }

  // Fallback for customer phone from order columns if unavailable
  if (!phone) {
    phone = "No number provided";
  }

  // Serialize properties to avoid potential React Server Component serialization warnings
  const serializedOrder = {
    id: order.id,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    shippingAddress: order.shippingAddress,
    paymentMode: order.paymentMode,
    paymentStatus: order.paymentStatus,
    amountPaid: order.amountPaid,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    paymentId: order.paymentId,
    orderStatus: order.orderStatus,
    shippingStatus: order.shippingStatus,
    awbNumber: order.awbNumber,
    shippingDetails: order.shippingDetails,
    cancelReason: order.cancelReason
  };

  const serializedItems = items.map(item => ({
    id: item.id,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    size: item.size,
    color: item.color,
    customizations: item.customizations
  }));

  return (
    <OrderDetailClient 
      order={serializedOrder} 
      items={serializedItems}
      customerPhone={phone}
    />
  );
}
