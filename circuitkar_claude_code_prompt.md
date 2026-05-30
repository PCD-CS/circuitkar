# Circuitkar.in — Full Stack Build Prompt for Claude Code

## Project Overview

Build a complete, production-ready e-commerce website for **Circuitkar** (circuitkar.in), an Indian electronics components store targeting makers, hobbyists, engineering students, and small manufacturers. The site launches in **pre-inventory mode** — all products show as "Out of Stock" with an interest/notify system to validate demand before purchasing inventory.

Tech stack, deployment, admin panel, analytics, and all integrations must be fully functional and deployable on day one.

---

## Tech Stack (Non-Negotiable)

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (Postgres + Auth + Storage)
- **Styling:** Tailwind CSS
- **Payments:** Razorpay (integrated but disabled — toggle via env variable `RAZORPAY_LIVE=false`)
- **Shipping:** Shiprocket (webhook receiver ready, not active)
- **Analytics:** Google Analytics 4 via `@next/third-parties`
- **Email:** Resend (for notify-me emails, free tier)
- **Image Storage:** Supabase Storage bucket `product-images`
- **Deployment:** Vercel-ready (next.config.js, environment variables documented)
- **Auth (Admin):** Supabase Auth — single admin user, email+password

---

## Design Direction

**Aesthetic:** Industrial-precision meets Indian maker culture. Dark-first design. Think: a serious tool for serious builders, not a toy shop. Clean, fast, zero bloat.

**Color Palette (CSS variables):**
```css
--bg-primary: #0A0A0A
--bg-secondary: #111111
--bg-card: #161616
--bg-elevated: #1E1E1E
--accent: #F97316        /* Orange — primary CTA, highlights */
--accent-hover: #EA6C0A
--accent-subtle: #F9731615
--text-primary: #F5F5F5
--text-secondary: #A3A3A3
--text-muted: #525252
--border: #262626
--border-subtle: #1A1A1A
--success: #22C55E
--error: #EF4444
--warning: #F59E0B
```

**Typography:**
- Display/Headings: `Space Mono` (Google Fonts) — technical, precise
- Body: `DM Sans` (Google Fonts) — clean, readable
- Code/specs: `JetBrains Mono` — for component values, specs

**Logo:** Text-based. "CIRCUIT**KAR**" where CIRCUIT is in `--text-secondary` and KAR is in `--accent` orange. Monospace font. A small circuit-trace underline SVG beneath it (decorative, 2px orange line with node dots).

**UI Principles:**
- Cards have 1px `--border` border, subtle hover lift with orange left-border accent on hover
- Buttons: primary = solid orange, secondary = ghost with orange border
- Badges: category tags are small, pill-shaped, dark background
- No rounded corners above 8px anywhere — precise, not bubbly
- Loading skeletons everywhere, never blank screens
- Mobile-first, but desktop is equally polished

---

## Site Structure

```
/ (Homepage)
/products (All products, filterable)
/products/[slug] (Product detail page)
/category/[slug] (Category filtered view)
/about
/contact
/track-order (stub page, active later)
/admin (protected, redirect to /admin/login if not auth)
/admin/login
/admin/dashboard
/admin/products
/admin/products/new
/admin/products/[id]/edit
/admin/interests
/admin/orders (stub, ready for later)
/admin/settings
```

---

## Database Schema (Supabase)

Run this as the initial migration:

```sql
-- Categories
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  icon text, -- emoji or icon name
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Products
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  short_description text,
  price decimal(10,2) not null,
  compare_price decimal(10,2), -- MRP/crossed out price
  sku text unique,
  category_id uuid references categories(id),
  images text[], -- array of Supabase storage URLs
  datasheet_url text,
  specifications jsonb, -- key-value pairs
  tags text[],
  in_stock boolean default false,
  stock_count int default 0,
  is_featured boolean default false,
  is_active boolean default true,
  weight_grams int,
  interest_count int default 0, -- cached count
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product interests (notify me)
create table product_interests (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  email text not null,
  name text,
  ip_address text,
  created_at timestamptz default now(),
  unique(product_id, email)
);

-- Orders (stub, ready for activation)
create table orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null,
  items jsonb not null, -- array of {product_id, name, qty, price}
  subtotal decimal(10,2),
  shipping_charge decimal(10,2) default 0,
  total decimal(10,2),
  status text default 'pending', -- pending, confirmed, shipped, delivered, cancelled
  payment_status text default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  shiprocket_order_id text,
  shiprocket_tracking text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Site settings
create table settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- RLS Policies
alter table products enable row level security;
alter table categories enable row level security;
alter table product_interests enable row level security;
alter table orders enable row level security;

-- Public read for products and categories
create policy "Public read products" on products for select using (is_active = true);
create policy "Public read categories" on categories for select using (true);

-- Anyone can insert interests
create policy "Public insert interests" on product_interests for insert with check (true);

-- Admin full access (via service role key in API routes)
```

---

## Seed Data — All Starting SKUs

Seed the database with these products (all `in_stock: false`, `is_active: true`):

### Category: Microcontrollers & Dev Boards
```
1. ESP32 DevKit V1
   slug: esp32-devkit-v1
   price: 249, compare_price: 299
   short_desc: Dual-core 240MHz, WiFi + Bluetooth, 38 pins, CP2102 USB
   specs: {Processor: "Xtensa LX6 Dual Core", Clock: "240 MHz", Flash: "4MB", WiFi: "802.11 b/g/n", Bluetooth: "v4.2 BR/EDR + BLE", GPIO: "38 pins", USB: "CP2102"}
   tags: [wifi, bluetooth, iot, popular]
   is_featured: true

2. ESP8266 NodeMCU v3
   slug: esp8266-nodemcu-v3
   price: 179, compare_price: 219
   short_desc: WiFi SoC, 80/160MHz, 11 GPIO pins, CH340 USB
   specs: {Processor: "Tensilica L106", Clock: "80/160 MHz", Flash: "4MB", WiFi: "802.11 b/g/n", GPIO: "11 pins"}
   tags: [wifi, iot, popular]
   is_featured: true

3. Arduino Uno R3 (Compatible)
   slug: arduino-uno-r3
   price: 249, compare_price: 299
   short_desc: ATmega328P, 14 digital I/O, 6 analog inputs, CH340 USB
   specs: {MCU: "ATmega328P", Clock: "16 MHz", Flash: "32KB", SRAM: "2KB", "Digital I/O": "14 pins", "Analog In": "6 pins"}
   tags: [beginner, popular, arduino]
   is_featured: true

4. Arduino Nano V3 (Compatible)
   slug: arduino-nano-v3
   price: 149, compare_price: 179
   short_desc: ATmega328P, mini form factor, 22 I/O pins
   specs: {MCU: "ATmega328P", Clock: "16 MHz", Flash: "32KB", "I/O Pins": "22"}
   tags: [beginner, compact, arduino]

5. Raspberry Pi Pico
   slug: raspberry-pi-pico
   price: 349, compare_price: 399
   short_desc: RP2040 dual-core ARM, 264KB SRAM, MicroPython ready
   specs: {MCU: "RP2040", Cores: "Dual ARM Cortex-M0+", Clock: "133 MHz", SRAM: "264KB", Flash: "2MB", GPIO: "26 pins"}
   tags: [micropython, popular]

6. STM32 Blue Pill (STM32F103C8T6)
   slug: stm32-bluepill
   price: 179, compare_price: 219
   short_desc: ARM Cortex-M3, 72MHz, 20KB SRAM, ST-Link compatible
   specs: {MCU: "STM32F103C8T6", Core: "ARM Cortex-M3", Clock: "72 MHz", Flash: "64KB", SRAM: "20KB", GPIO: "32 pins"}
   tags: [arm, stm32, advanced]
```

### Category: Sensors
```
7. DHT11 Temperature & Humidity Sensor
   slug: dht11-sensor
   price: 59, compare_price: 79
   short_desc: Digital temp & humidity, 3-5V, ±2°C accuracy
   specs: {Type: "Digital", "Temp Range": "0-50°C", "Humidity Range": "20-90% RH", Accuracy: "±2°C / ±5% RH", Voltage: "3-5.5V", Protocol: "Single-wire"}
   tags: [temperature, humidity, popular, beginner]
   is_featured: true

8. DHT22 Temperature & Humidity Sensor
   slug: dht22-sensor
   price: 149, compare_price: 179
   short_desc: High accuracy temp & humidity, -40 to 80°C, ±0.5°C
   specs: {Type: "Digital", "Temp Range": "-40 to 80°C", "Humidity Range": "0-100% RH", Accuracy: "±0.5°C / ±2-5% RH", Voltage: "3.3-6V"}
   tags: [temperature, humidity, precision]

9. HC-SR04 Ultrasonic Distance Sensor
   slug: hc-sr04-ultrasonic
   price: 59, compare_price: 79
   short_desc: 2cm-400cm range, 5V, 15° beam angle
   specs: {Range: "2cm - 400cm", Voltage: "5V DC", Current: "15mA", Frequency: "40Hz", Accuracy: "3mm"}
   tags: [distance, ultrasonic, popular, beginner]
   is_featured: true

10. IR Infrared Obstacle Sensor Module
    slug: ir-obstacle-sensor
    price: 39, compare_price: 59
    short_desc: Adjustable detection 2-30cm, digital output, 5V
    specs: {Range: "2-30cm adjustable", Output: "Digital", Voltage: "3.3-5V", LED: "Indicator included"}
    tags: [ir, obstacle, robotics, beginner]

11. MPU-6050 Accelerometer + Gyroscope
    slug: mpu6050-imu
    price: 99, compare_price: 129
    short_desc: 6-axis IMU, I2C, ±2/4/8/16g, 3.3/5V
    specs: {Axes: "6 (3 accel + 3 gyro)", Interface: "I2C", "Accel Range": "±2/4/8/16g", "Gyro Range": "±250/500/1000/2000°/s", Voltage: "3-5V"}
    tags: [imu, gyroscope, accelerometer, drone]

12. BMP280 Barometric Pressure + Temperature
    slug: bmp280-pressure-sensor
    price: 89, compare_price: 119
    short_desc: I2C/SPI, 300-1100 hPa, ±1 hPa accuracy
    specs: {Interface: "I2C / SPI", "Pressure Range": "300-1100 hPa", Accuracy: "±1 hPa", "Temp Range": "-40 to 85°C", Voltage: "3.3-5V"}
    tags: [pressure, weather, altitude]

13. Soil Moisture Sensor Module
    slug: soil-moisture-sensor
    price: 49, compare_price: 69
    short_desc: Analog + digital output, 3.3-5V, for plant monitoring
    specs: {Output: "Analog + Digital", Voltage: "3.3-5V", Application: "Soil moisture detection"}
    tags: [agriculture, iot, garden]

14. MQ-2 Gas / Smoke Sensor
    slug: mq2-gas-sensor
    price: 89, compare_price: 119
    short_desc: LPG, smoke, alcohol, propane detection, analog + digital
    specs: {Detects: "LPG, Smoke, Alcohol, Propane", Output: "Analog + Digital", Voltage: "5V", Preheat: "20s"}
    tags: [gas, smoke, safety]

15. MQ-135 Air Quality Sensor
    slug: mq135-air-quality
    price: 89, compare_price: 119
    short_desc: CO2, NH3, benzene, alcohol detection
    specs: {Detects: "CO2, NH3, Benzene, Alcohol, Smoke", Output: "Analog + Digital", Voltage: "5V"}
    tags: [air quality, gas, environment]
```

### Category: Displays
```
16. 0.96" OLED Display I2C (128x64)
    slug: oled-096-i2c
    price: 129, compare_price: 159
    short_desc: SSD1306, I2C, 128x64px, 3.3-5V, white pixels
    specs: {Driver: "SSD1306", Interface: "I2C (addr 0x3C)", Resolution: "128x64", Size: "0.96 inch", Voltage: "3.3-5V", Color: "White"}
    tags: [display, oled, popular]
    is_featured: true

17. 16x2 LCD Display with I2C Adapter
    slug: lcd-16x2-i2c
    price: 99, compare_price: 129
    short_desc: HD44780 16x2, I2C backpack included, blue backlight
    specs: {Type: "Character LCD", Columns: "16", Rows: "2", Interface: "I2C (via PCF8574)", Backlight: "Blue/White", Voltage: "5V"}
    tags: [display, lcd, beginner]

18. 1.44" TFT Color Display SPI (128x128)
    slug: tft-144-spi
    price: 149, compare_price: 199
    short_desc: ST7735, SPI, 128x128 color, 3.3V
    specs: {Driver: "ST7735", Interface: "SPI", Resolution: "128x128", Colors: "65K (16-bit)", Voltage: "3.3V"}
    tags: [display, tft, color]
```

### Category: Power Management
```
19. TP4056 Lithium Battery Charger Module
    slug: tp4056-charger
    price: 39, compare_price: 59
    short_desc: 1A Li-ion/LiPo charger, USB-C input, with protection
    specs: {Input: "USB-C / Micro-USB", Charge Current: "1A max", Battery: "3.7V Li-ion/LiPo", Protection: "Overcharge, Overdischarge, Short circuit"}
    tags: [battery, charger, popular]
    is_featured: true

20. LM7805 5V Voltage Regulator (TO-220)
    slug: lm7805-regulator
    price: 19, compare_price: 29
    short_desc: Fixed 5V output, 1A, TO-220 package
    specs: {Output: "5V fixed", "Max Current": "1A", Package: "TO-220", "Input Range": "7-35V", Dropout: "2V"}
    tags: [regulator, power, popular]

21. LM2596 DC-DC Buck Converter Module
    slug: lm2596-buck
    price: 69, compare_price: 99
    short_desc: Adjustable 1.25-35V out, 3A, with display
    specs: {Input: "4-40V", Output: "1.25-35V adjustable", "Max Current": "3A", Efficiency: "92%"}
    tags: [buck, converter, power]

22. MT3608 DC-DC Boost Converter Module
    slug: mt3608-boost
    price: 49, compare_price: 69
    short_desc: 2-24V in, up to 28V out, 2A
    specs: {Input: "2-24V", Output: "5-28V adjustable", "Max Current": "2A", Efficiency: "93%"}
    tags: [boost, converter, power]

23. XL4016 High Power Buck Converter
    slug: xl4016-buck-8a
    price: 89, compare_price: 129
    short_desc: 4-40V in, adjustable out, 8A max current
    specs: {Input: "4-40V", Output: "1.25-36V adjustable", "Max Current": "8A", Efficiency: "94%"}
    tags: [buck, high power, converter]
```

### Category: Motor & Relay Control
```
24. L298N Dual H-Bridge Motor Driver
    slug: l298n-motor-driver
    price: 99, compare_price: 129
    short_desc: Dual DC motor / stepper, 2A per channel, 5-35V
    specs: {Motors: "2x DC or 1x Stepper", "Current per channel": "2A", "Motor Voltage": "5-35V", "Logic Voltage": "5V", Interface: "TTL compatible"}
    tags: [motor, driver, robotics, popular]
    is_featured: true

25. L293D Motor Driver IC (DIP-16)
    slug: l293d-ic
    price: 49, compare_price: 69
    short_desc: Quad half-H driver, 600mA per channel
    specs: {Package: "DIP-16", "Current per channel": "600mA", Channels: "4 (2 full H-bridge)", "Motor Voltage": "4.5-36V"}
    tags: [motor, ic, driver]

26. 1 Channel 5V Relay Module
    slug: relay-1ch-5v
    price: 49, compare_price: 69
    short_desc: 5V coil, 10A/250VAC, optocoupler isolated
    specs: {Coil: "5V DC", "AC Rating": "250V/10A", "DC Rating": "30V/10A", Isolation: "Optocoupler", Trigger: "Active LOW"}
    tags: [relay, switching, iot]

27. 4 Channel 5V Relay Module
    slug: relay-4ch-5v
    price: 129, compare_price: 169
    short_desc: 4x independent relays, 5V, optocoupler isolated
    specs: {Channels: "4", Coil: "5V DC", "AC Rating": "250V/10A", Isolation: "Optocoupler"}
    tags: [relay, switching, home automation]

28. A4988 Stepper Motor Driver Module
    slug: a4988-stepper-driver
    price: 109, compare_price: 149
    short_desc: Up to 1/16 microstepping, 2A max, with heatsink
    specs: {"Max Current": "2A", Microstep: "Full, 1/2, 1/4, 1/8, 1/16", "Motor Voltage": "8-35V", "Logic Voltage": "3.3-5V"}
    tags: [stepper, cnc, 3dprinter, driver]
```

### Category: Connectivity & Communication
```
29. HC-05 Bluetooth Module
    slug: hc-05-bluetooth
    price: 199, compare_price: 249
    short_desc: Classic BT 2.0, UART, master/slave modes, AT commands
    specs: {Standard: "Bluetooth 2.0", Interface: "UART", "Baud Rate": "9600 default", Mode: "Master/Slave", Range: "10m", Voltage: "3.3-6V"}
    tags: [bluetooth, wireless, serial]

30. NRF24L01 2.4GHz RF Transceiver Module
    slug: nrf24l01-rf
    price: 89, compare_price: 129
    short_desc: 2.4GHz ISM band, SPI, 250kbps/1Mbps/2Mbps, 100m range
    specs: {Frequency: "2.4 GHz", Interface: "SPI", Range: "up to 100m", "Data Rate": "250kbps/1/2Mbps", Voltage: "1.9-3.6V"}
    tags: [rf, wireless, long range]
```

### Category: Prototyping & Tools
```
31. 400 Point Solderless Breadboard
    slug: breadboard-400
    price: 49, compare_price: 69
    short_desc: Half-size, 400 tie points, ABS, standard pitch
    specs: {Points: "400", Pitch: "2.54mm", Material: "ABS", Dimensions: "83 x 55mm"}
    tags: [prototyping, beginner, popular]
    is_featured: true

32. 830 Point Solderless Breadboard
    slug: breadboard-830
    price: 79, compare_price: 99
    short_desc: Full-size, 830 tie points, 2 power rails each side
    specs: {Points: "830", Pitch: "2.54mm", "Power Rails": "4 (2 per side)"}
    tags: [prototyping, beginner]

33. Jumper Wires Male-Male 40pc (20cm)
    slug: jumper-mm-40pc
    price: 59, compare_price: 79
    short_desc: 40 pieces, 20cm, 28AWG, assorted colors
    specs: {Quantity: "40 pieces", Length: "20cm", Type: "Male-Male", AWG: "28"}
    tags: [wires, prototyping, popular]
    is_featured: true

34. Jumper Wires Male-Female 40pc (20cm)
    slug: jumper-mf-40pc
    price: 59, compare_price: 79
    short_desc: 40 pieces, 20cm, for sensor connections
    specs: {Quantity: "40 pieces", Length: "20cm", Type: "Male-Female"}
    tags: [wires, prototyping, popular]

35. Jumper Wires Female-Female 40pc (20cm)
    slug: jumper-ff-40pc
    price: 59, compare_price: 79
    short_desc: 40 pieces, 20cm, for module-to-module
    specs: {Quantity: "40 pieces", Length: "20cm", Type: "Female-Female"}
    tags: [wires, prototyping]

36. 40-Pin Male Header Strip (2.54mm)
    slug: male-header-40pin
    price: 19, compare_price: 29
    short_desc: Single row, breakable, gold-plated, pack of 5
    specs: {Pins: "40 per strip", Pitch: "2.54mm", Pack: "5 strips", Type: "Single row male"}
    tags: [headers, pcb, prototyping]

37. Micro USB Cable 1m (Charging + Data)
    slug: micro-usb-cable-1m
    price: 49, compare_price: 79
    short_desc: Braided, 2.4A, data + charge, Arduino/NodeMCU compatible
    specs: {Length: "1 meter", Connector: "Micro USB Type-B", Current: "2.4A max", Type: "Braided"}
    tags: [cable, usb, accessories]

38. USB Type-C Cable 1m
    slug: usbc-cable-1m
    price: 59, compare_price: 89
    short_desc: Braided, 3A, data + charge, TP4056 / ESP32 compatible
    specs: {Length: "1 meter", Connector: "USB Type-C", Current: "3A max"}
    tags: [cable, usb-c, accessories]

39. Resistor Kit (600pcs, 30 values)
    slug: resistor-kit-600pc
    price: 99, compare_price: 139
    short_desc: 30 values × 20pcs, 1/4W, 1% tolerance, with box
    specs: {Total: "600 pieces", Values: "30 different (10Ω to 1MΩ)", Power: "1/4W", Tolerance: "1%"}
    tags: [resistors, kit, beginner, popular]

40. LED Assorted Pack (100pcs, 5 colors)
    slug: led-assorted-100pc
    price: 79, compare_price: 99
    short_desc: 5mm, 100pcs — Red, Green, Blue, Yellow, White (20 each)
    specs: {Quantity: "100 pieces", Size: "5mm", Colors: "Red, Green, Blue, Yellow, White", "Forward Voltage": "1.8-3.2V"}
    tags: [led, beginner, popular]

41. Heatshrink Tube Kit (120pcs, 5 sizes)
    slug: heatshrink-kit
    price: 89, compare_price: 119
    short_desc: 5 diameters, 2:1 shrink ratio, black
    specs: {Total: "120 pieces", Sizes: "2mm, 3mm, 4mm, 6mm, 8mm", Ratio: "2:1", Color: "Black"}
    tags: [wiring, finishing, tools]

42. PCB Standoff Spacer Kit (M3, 120pcs)
    slug: m3-standoff-kit
    price: 99, compare_price: 139
    short_desc: M3 male-female standoffs + screws + nuts, brass
    specs: {Thread: "M3", Material: "Brass", Lengths: "6mm, 8mm, 10mm, 12mm", Includes: "Screws + Nuts"}
    tags: [pcb, mounting, hardware]
```

### Category: Timing & Storage
```
43. DS3231 RTC Module (High Accuracy)
    slug: ds3231-rtc
    price: 119, compare_price: 149
    short_desc: ±2ppm accuracy, I2C, battery backup, 3.3-5V
    specs: {Accuracy: "±2ppm (0-40°C)", Interface: "I2C", Battery: "CR2032 (included)", Voltage: "3.3-5V", Features: "Temperature compensated"}
    tags: [rtc, clock, timekeeping]

44. Micro SD Card Module
    slug: microsd-module
    price: 49, compare_price: 69
    short_desc: SPI interface, 3.3V/5V compatible, FAT16/FAT32
    specs: {Interface: "SPI", Voltage: "3.3-5V (onboard regulator)", Format: "FAT16 / FAT32", "Card type": "Micro SD / SDHC"}
    tags: [storage, data logging, spi]
```

### Category: Lighting
```
45. WS2812B RGB LED Strip (1m, 60 LEDs/m)
    slug: ws2812b-strip-1m
    price: 299, compare_price: 399
    short_desc: Individually addressable, 5V, IP30, 60 LEDs/meter
    specs: {LEDs: "60/meter", Length: "1 meter", Voltage: "5V DC", Control: "Single data wire", Protocol: "WS2812B", Waterproof: "IP30 (non-waterproof)"}
    tags: [led strip, addressable, neopixel, lighting]
    is_featured: true
```

---

## Page Designs

### Homepage (`/`)

**Hero Section:**
- Full-width dark section
- Large headline: `"Components for Builders."` (Space Mono, ~64px)
- Subtext: `"Quality electronic components. Fast shipping across India. Trusted by makers, engineers & students."`
- Two CTAs: `[Browse Components]` (orange filled) and `[Get Notified When Live]` (ghost)
- Background: subtle circuit board grid pattern (CSS, not image) — thin #262626 lines
- Small status badge: `"🟡 Launching Soon — Register Interest on Products"`

**Stats Bar:**
- `45+ Components` | `Pan-India Shipping` | `GST Invoices` | `Maker Community`

**Featured Products Grid:**
- Section title: `"Fast Movers"`
- Show all `is_featured: true` products
- Each card shows: image placeholder (grey box with category icon), name, price, "OUT OF STOCK" badge in muted red, and `[Notify Me]` button

**Categories Section:**
- Grid of all categories with icon + name + product count
- Clicking goes to `/category/[slug]`

**Why Circuitkar Section:**
- 4 points: Curated Selection / Fast Shipping / GST Invoices / Genuine Components
- Icon + heading + 1 line desc each

**Footer:**
- Logo, tagline
- Links: Products, About, Contact, Track Order
- Social: Instagram, WhatsApp (wa.me link)
- `© 2025 Circuitkar. GST Registered. Silvassa, India.`
- Payment icons (Razorpay badge)

---

### Products Page (`/products`)

**Left sidebar (desktop) / Top filters (mobile):**
- Search bar (instant filter)
- Category filter (checkboxes)
- Price range slider
- In Stock only toggle (greyed out/disabled with tooltip "Coming soon")
- Sort: Featured / Price Low-High / Price High-Low / Newest

**Product grid:**
- 3 columns desktop, 2 tablet, 1 mobile
- Each card:
  - Product image (grey placeholder with subtle icon if no image)
  - Category badge (pill, top left)
  - Name (2 lines max, truncate)
  - Price (orange) + compare price (crossed out, muted)
  - `OUT OF STOCK` badge
  - `[🔔 Notify Me]` button — opens modal

**Notify Me Modal:**
- Product name at top
- "Be the first to know when this is in stock"
- Input: Name (optional), Email (required)
- Submit button
- On success: show count "You're #[N] on the list for this product"
- Store in `product_interests` table

---

### Product Detail Page (`/products/[slug]`)

**Layout:** 2-column (image left, details right) on desktop

**Left:**
- Large product image (placeholder)
- Thumbnail strip (if multiple images)

**Right:**
- Breadcrumb: Home > Category > Product
- Product name (large, Space Mono)
- Price (large orange) + compare price
- `OUT OF STOCK` badge (prominent)
- Short description
- `[🔔 Notify Me When Available]` button (full width, orange)
- Interest count: `"📊 [N] people are interested in this"`
- Divider
- Specifications table (from `specifications` jsonb — key: value rows)
- Tags (pill badges)
- Datasheet button (if `datasheet_url` set): `[📄 Download Datasheet]`

**Below fold:**
- Full description (markdown rendered)
- Related products (same category, 4 products)

---

### Admin Panel

**Login (`/admin/login`):**
- Clean centered form, dark theme
- Email + Password
- Uses Supabase Auth `signInWithPassword`
- Redirect to `/admin/dashboard` on success

**Dashboard (`/admin/dashboard`):**
Stats cards:
- Total Products
- Total Interests (all time)
- Products with 5+ interests (ready to stock)
- Top 5 most-interested products (table: name, interest count, category)

**Products List (`/admin/products`):**
- Table: Image thumb | Name | Category | Price | Stock Status | Interest Count | Active | Actions
- Toggle `in_stock` directly in table (switch)
- Toggle `is_active` in table
- Actions: Edit | View on site
- Add New Product button

**New/Edit Product (`/admin/products/new` and `/admin/products/[id]/edit`):**
Full form with:
- Name (auto-generates slug)
- Short description
- Full description (textarea, markdown)
- Category (select)
- Price + Compare Price
- SKU
- In Stock toggle
- Is Featured toggle
- Is Active toggle
- Stock Count (number)
- Weight (grams)
- Tags (comma separated input that converts to array)
- Specifications (dynamic key-value pair builder — add/remove rows)
- Datasheet URL
- Image URLs (text inputs for now, Supabase storage later)
- Save / Save & Continue Editing / Cancel

**Interests (`/admin/interests`):**
- Filter by product
- Table: Product | Email | Name | Date
- Export to CSV button
- Interest count per product bar chart (simple, CSS-based)

**Settings (`/admin/settings`):**
- Site name
- Announcement bar text (e.g. "🚀 Launching soon — register interest on products!")
- Announcement bar toggle (show/hide)
- Free shipping threshold
- Razorpay Live Mode toggle (checkbox — when unchecked, checkout is disabled globally)
- Admin email
- WhatsApp number
- Save button

---

## Key Components to Build

```
components/
  layout/
    Header.tsx          -- Logo, nav, cart icon (disabled), mobile menu
    Footer.tsx
    AnnouncementBar.tsx -- Pulls from settings table
  product/
    ProductCard.tsx     -- Used in grid
    ProductGrid.tsx     -- Responsive grid wrapper
    NotifyMeModal.tsx   -- Email capture modal
    InterestBadge.tsx   -- "N people interested"
    OutOfStockBadge.tsx
    SpecsTable.tsx      -- Key-value specs display
  ui/
    Button.tsx          -- primary, secondary, ghost variants
    Badge.tsx           -- category, status badges
    Input.tsx
    Modal.tsx
    Skeleton.tsx        -- Loading skeleton
    Toast.tsx           -- Success/error notifications
  admin/
    AdminLayout.tsx     -- Sidebar nav + top bar
    ProductForm.tsx     -- Reused in new + edit
    StatsCard.tsx
    DataTable.tsx       -- Reusable sortable table
```

---

## API Routes

```
app/api/
  interests/
    route.ts            -- POST: submit interest, GET: count for product
  products/
    route.ts            -- GET: list with filters
    [slug]/route.ts     -- GET: single product
  admin/
    products/
      route.ts          -- GET + POST (authenticated)
      [id]/route.ts     -- PUT + DELETE (authenticated)
    interests/
      route.ts          -- GET all (authenticated)
      export/route.ts   -- GET CSV export
    settings/
      route.ts          -- GET + PUT (authenticated)
  webhooks/
    razorpay/route.ts   -- Stub receiver
    shiprocket/route.ts -- Stub receiver
```

---

## Environment Variables

Create `.env.local.example`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Razorpay (disabled until RAZORPAY_LIVE=true)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_LIVE=false

# Shiprocket
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=

# Resend (email notifications)
RESEND_API_KEY=

# Admin
ADMIN_EMAIL=

# Site
NEXT_PUBLIC_SITE_URL=https://circuitkar.in
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
```

---

## SEO Requirements

- `metadata` export on every page (Next.js 14 App Router style)
- Homepage title: `"Circuitkar — Electronic Components for Indian Makers"`
- Product pages: `"Buy [Product Name] in India | Circuitkar"`
- Category pages: `"[Category] Components | Circuitkar"`
- `robots.txt` — allow all
- `sitemap.xml` — dynamic, generated from products table
- OG image meta tags on all pages
- Structured data (JSON-LD Product schema) on product pages

---

## Performance Requirements

- Images: Next.js `<Image>` component everywhere
- Fonts: `next/font/google` with `display: swap`
- No unnecessary client components — use server components where possible
- Loading states: Suspense boundaries with skeleton components
- Mobile: tap targets minimum 44px

---

## Additional UX Details

1. **Announcement bar** at very top (dismissible, orange background): `"🚀 Launching Soon — Click 'Notify Me' on products you want!"` — pulled from settings table

2. **WhatsApp float button** — fixed bottom-right on all pages. Opens `wa.me/91XXXXXXXXXX?text=Hi Circuitkar, I have a query`

3. **Interest counter animation** — when modal submits successfully, the counter on the product card increments with a small animation

4. **Category icons** (use lucide-react):
   - Microcontrollers: `Cpu`
   - Sensors: `Radio`
   - Displays: `Monitor`
   - Power: `Zap`
   - Motors & Relay: `Settings`
   - Connectivity: `Wifi`
   - Prototyping: `Grid`
   - Timing & Storage: `Clock`
   - Lighting: `Lightbulb`

5. **404 page** — custom, dark, with "Let's get you back on track" + link to products

6. **Empty states** — all lists/grids have an empty state illustration (simple SVG inline)

---

## Deployment Notes

- `vercel.json` — configure for Next.js
- All Supabase calls use service role key only in API routes (never client-side)
- `middleware.ts` — protect all `/admin/*` routes, redirect to `/admin/login` if no session
- `README.md` — include full setup guide: Supabase project setup, env vars, first admin user creation, deployment steps

---

## Do Not Include (For Now)

- Cart / checkout flow (Razorpay integration stubbed only)
- User accounts / login for customers
- Reviews / ratings
- Blog
- Payment processing
- Order placement

These are Phase 2. The entire Phase 1 goal is: **beautiful catalog + interest capture + admin control.**

---

## Final Output Should Be

A complete Next.js 14 project that can be:
1. Cloned
2. Supabase project created, SQL run
3. `.env.local` filled in
4. `npm run dev` — fully working locally
5. `vercel deploy` — live on circuitkar.in

With zero placeholder "TODO" items in core functionality.
