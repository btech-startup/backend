/**
 * End-to-End Test Suite for User-Side Integration & Chatbot Deal Negotiation
 * Verifies:
 *  1. Sample Vendors Configuration API (/api/v1/user/sample-vendors)
 *  2. Public Vendor Directory with Filtering & Search (/api/v1/user/vendors)
 *  3. Vendor Public Details with Integration Values (/api/v1/user/vendors/:id)
 *  4. Vendor Verified Banking & Settlement Details (/api/v1/user/vendors/:id/banking)
 *  5. Chatbot Deal Negotiation Initiation (/api/v1/user/deals/chatbot)
 *  6. Multi-turn Chatbot Negotiation (/api/v1/user/deals/:dealId/negotiate)
 *  7. Retrieve Completed Deal & Settlement Breakdown (/api/v1/user/deals/:dealId)
 */

import http from 'http';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { seed } from '../prisma/seed';

const PORT = 5056;
let server: http.Server;
let baseUrl: string;

async function request(path: string, options: { method?: string; body?: any; token?: string } = {}) {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runUserE2ETests() {
  console.log('🔄 Starting User Experience & Chatbot Test Server on port', PORT);
  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // Ensure database has sample data
    await seed();

    console.log('\n--- Step 1: Get Curated Sample Vendors for Testing ---');
    const sampleRes = await request('/api/v1/user/sample-vendors');
    console.log('Status:', sampleRes.status);
    console.log('Sample Vendors Count:', sampleRes.data.count);
    if (!sampleRes.data.success || sampleRes.data.count === 0) {
      throw new Error('Failed to retrieve sample vendors');
    }
    const sampleVendor = sampleRes.data.data[0];
    console.log(`First Sample Vendor: ${sampleVendor.businessName} (Category: ${sampleVendor.category}, Phone: ${sampleVendor.phoneForLoginOtp})`);

    console.log('\n--- Step 2: Browse Verified Vendors in Directory ---');
    const vendorsListRes = await request('/api/v1/user/vendors?category=DECORATION&limit=5');
    console.log('Status:', vendorsListRes.status);
    console.log('Vendors Found:', vendorsListRes.data.data.total);
    if (!vendorsListRes.data.success || vendorsListRes.data.data.vendors.length === 0) {
      throw new Error('Failed to list vendors with category filter');
    }
    const targetVendor = vendorsListRes.data.data.vendors[0];
    console.log(`Target Vendor: ${targetVendor.businessName} (ID: ${targetVendor.id})`);

    console.log('\n--- Step 3: Get Vendor Public Details & Integration Values ---');
    const vendorDetailRes = await request(`/api/v1/user/vendors/${targetVendor.id}`);
    console.log('Status:', vendorDetailRes.status);
    const vendorDetail = vendorDetailRes.data.data;
    console.log('Vendor Bio:', vendorDetail.bio);
    console.log('Integration Values (Chatbot):', vendorDetail.integrationValues.chatbot);
    console.log('Integration Values (Banking):', vendorDetail.integrationValues.banking);
    if (!vendorDetail.integrationValues.chatbot.enabled) {
      throw new Error('Chatbot integration value missing or disabled');
    }
    if (!vendorDetail.integrationValues.banking.upiId) {
      throw new Error('Banking UPI ID integration value missing');
    }

    console.log('\n--- Step 4: Get Vendor Verified Banking Details ---');
    const bankingRes = await request(`/api/v1/user/vendors/${targetVendor.id}/banking`);
    console.log('Status:', bankingRes.status);
    console.log('Banking Data:', bankingRes.data.data);
    if (!bankingRes.data.data.banking.upiId || !bankingRes.data.data.banking.ifscCode) {
      throw new Error('Banking endpoint did not return valid UPI / IFSC details');
    }

    console.log('\n--- Step 5: Deal with Chatbot (Initiate Deal Negotiation) ---');
    const targetPriceCard = vendorDetail.priceCards[0];
    console.log(`Target Price Package: "${targetPriceCard?.title}" - Standard Rate: ₹${targetPriceCard?.price}`);

    const chatbotDealRes = await request('/api/v1/user/deals/chatbot', {
      method: 'POST',
      body: {
        vendorId: targetVendor.id,
        priceCardId: targetPriceCard?.id,
        clientName: 'Sunita Mehra',
        clientPhone: '+919911223344',
        clientEmail: 'sunita.mehra@example.com',
        eventType: 'Sangeet & Wedding Ceremony',
        eventDate: '2026-11-28',
        guestCount: 400,
        offeredPrice: Math.round((targetPriceCard?.price || 85000) * 0.9), // 10% discount request
        userMessage: 'Hello! We love your work. Can you offer a 10% package discount for our upcoming wedding?',
      },
    });

    console.log('Chatbot Deal Status:', chatbotDealRes.status);
    console.log('Deal Response:', {
      dealId: chatbotDealRes.data.data.dealId,
      status: chatbotDealRes.data.data.status,
      originalPrice: chatbotDealRes.data.data.originalPrice,
      offeredPrice: chatbotDealRes.data.data.offeredPrice,
      agreedPrice: chatbotDealRes.data.data.agreedPrice,
      chatbotResponse: chatbotDealRes.data.data.chatbotResponse,
    });

    if (!chatbotDealRes.data.success || !chatbotDealRes.data.data.dealId) {
      throw new Error('Failed to initiate chatbot deal');
    }
    const dealId = chatbotDealRes.data.data.dealId;

    console.log('\n--- Step 6: Multi-turn Chatbot Negotiation (Send Follow-up Message) ---');
    const negotiateRes = await request(`/api/v1/user/deals/${dealId}/negotiate`, {
      method: 'POST',
      body: {
        userMessage: 'Can we confirm the deal now? What is the advance booking amount needed?',
      },
    });

    console.log('Negotiation Status:', negotiateRes.status);
    console.log('Chatbot Reply:', negotiateRes.data.data.chatbotResponse);
    console.log('Updated Payment Details:', negotiateRes.data.data.paymentDetails);
    if (!negotiateRes.data.success) {
      throw new Error('Chatbot negotiation turn failed');
    }

    console.log('\n--- Step 7: Get Full Deal Details with Settlement & Banking Info ---');
    const getDealRes = await request(`/api/v1/user/deals/${dealId}`);
    console.log('Get Deal Status:', getDealRes.status);
    console.log('Deal Status:', getDealRes.data.data.status);
    console.log('Chat Turns Count:', getDealRes.data.data.chatHistory.length);
    console.log('Banking Settlement for Payment:', getDealRes.data.data.bankingSettlement);

    if (!getDealRes.data.data.bankingSettlement.upiId) {
      throw new Error('Deal settlement missing vendor UPI ID');
    }

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL 7 USER & CHATBOT INTEGRATION TESTS PASSED!');
    console.log('🎉 ========================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runUserE2ETests();
