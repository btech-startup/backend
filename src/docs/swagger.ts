import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management - Vendor & User Experience API',
      version: '1.0.0',
      description: `
## Complete Event Management Platform API (Vendor + User Side)

This backend service powers vendor onboarding, KYC compliance, rate cards, and public user-side integration:

### 🌟 1. User-Side Integration Values
- **Chatbot Deal Negotiation**: Clients can negotiate packages directly with an automated AI Deal Assistant (\`/api/v1/user/deals/chatbot\`), calculate feasible discounts, send counter-offers, and lock in agreements.
- **Banking & Settlement Details**: Secure public access to vendor verified banking information (\`/api/v1/user/vendors/{id}/banking\`) including **UPI ID, Bank IFSC, Account Number, Bank Name, and payment schedule** for escrow and advance deposits.
- **Vendor Directory**: Full search, filtering, verified badges, rating & portfolio explorer (\`/api/v1/user/vendors\`).

### 🛠️ 2. Vendor Onboarding & Dashboard
- **Mobile Number OTP Verification**: Instant registration & JWT session issuance.
- **Three-Tier KYC**: Aadhaar (with simulated OTP), Indian PAN, and Bank Account Penny Drop.
- **Price Card (Rate Card)**: Create and manage packages with pricing units (\`PER_EVENT\`, \`PER_DAY\`, \`PER_HOUR\`, \`PER_PLATE\`, \`FIXED\`).

### 🧪 3. Ready-To-Test Pre-Configured Sample Vendors
To immediately test any API without manual setup, call \`GET /api/v1/user/sample-vendors\` or use these pre-seeded vendors:
- **Royal Grand Decorators & Events** (DECORATION, Bangalore) - Phone: \`+919876500001\` | ID: \`70421caf-a7ef-4cad-9960-48ba6fabf7a7\` | UPI: \`royalgrand@okhdfcbank\`
- **Saffron Spice Caterers & Banquets** (CATERING, Mumbai) - Phone: \`+919876500002\` | UPI: \`saffronspice@icici\`
- **PixelCraft Luxury Wedding Photography** (PHOTOGRAPHY, Delhi) - Phone: \`+919876500003\` | UPI: \`pixelcraft@oksbi\`
- **SoundWave DJ & Stage Production** (SOUND_DJ, Hyderabad) - Phone: \`+919876500004\` | UPI: \`soundwave@axisbank\`
- **Glamour Bridal Artistry by Ananya** (MAKEUP_ARTIST, Bangalore) - Phone: \`+919876500005\` | UPI: \`ananya.sen@kotak\`
- **The Grand Heritage Palace & Lawns** (VENUE, Jaipur) - Phone: \`+919876500006\` | UPI: \`grandheritage@barodampay\`

*Mock OTP for all sample vendor logins is \`123456\`.*
      `,
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from `/api/v1/auth/verify-otp`',
        },
      },
    },
    tags: [
      { name: 'User Experience & Directory', description: 'User-side vendor discovery, verified profiles, and banking details' },
      { name: 'Chatbot & Deal Negotiation', description: 'Interactive AI Chatbot for deal negotiations, quotes, and payment scheduling' },
      { name: 'Authentication', description: 'Vendor mobile registration and OTP verification' },
      { name: 'KYC Verification', description: 'Aadhaar, PAN, and Bank account compliance verification' },
      { name: 'Vendor Profile & Dashboard', description: 'Vendor profile management and dashboard statistics' },
      { name: 'Price Card (Rate Card)', description: 'Vendor service packages, rates, and inclusions' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
