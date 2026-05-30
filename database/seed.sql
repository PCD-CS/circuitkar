-- ============================================================
-- Circuitkar — Seed Data
-- Run AFTER schema.sql. All products launch in pre-inventory
-- mode: in_stock = false, is_active = true.
-- ============================================================

-- ----------------------------------------------------------------
-- Categories
-- ----------------------------------------------------------------
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Microcontrollers & Dev Boards', 'microcontrollers', 'Dev boards and microcontrollers for every project — ESP32, Arduino, Raspberry Pi Pico, STM32 and more.', 'cpu', 1),
  ('Sensors', 'sensors', 'Temperature, distance, motion, gas and environmental sensors for makers.', 'radio', 2),
  ('Displays', 'displays', 'OLED, LCD and TFT displays to give your projects a screen.', 'monitor', 3),
  ('Power Management', 'power-management', 'Chargers, regulators and DC-DC converters to power your builds.', 'zap', 4),
  ('Motor & Relay Control', 'motor-relay', 'Motor drivers, stepper drivers and relay modules for robotics and automation.', 'settings', 5),
  ('Connectivity & Communication', 'connectivity', 'Bluetooth and RF modules to make your projects talk.', 'wifi', 6),
  ('Prototyping & Tools', 'prototyping', 'Breadboards, jumper wires, headers, kits and accessories.', 'grid', 7),
  ('Timing & Storage', 'timing-storage', 'Real-time clocks and storage modules for data logging.', 'clock', 8),
  ('Lighting', 'lighting', 'Addressable LED strips and lighting components.', 'lightbulb', 9);

-- ----------------------------------------------------------------
-- Products
-- ----------------------------------------------------------------

-- Microcontrollers & Dev Boards
INSERT INTO products (name, slug, short_description, price, compare_price, sku, category_id, specifications, tags, is_featured)
VALUES
('ESP32 DevKit V1', 'esp32-devkit-v1', 'Dual-core 240MHz, WiFi + Bluetooth, 38 pins, CP2102 USB', 249, 299, 'CK-MCU-ESP32',
 (SELECT id FROM categories WHERE slug = 'microcontrollers'),
 '{"Processor":"Xtensa LX6 Dual Core","Clock":"240 MHz","Flash":"4MB","WiFi":"802.11 b/g/n","Bluetooth":"v4.2 BR/EDR + BLE","GPIO":"38 pins","USB":"CP2102"}',
 ARRAY['wifi','bluetooth','iot','popular'], true),

('ESP8266 NodeMCU v3', 'esp8266-nodemcu-v3', 'WiFi SoC, 80/160MHz, 11 GPIO pins, CH340 USB', 179, 219, 'CK-MCU-ESP8266',
 (SELECT id FROM categories WHERE slug = 'microcontrollers'),
 '{"Processor":"Tensilica L106","Clock":"80/160 MHz","Flash":"4MB","WiFi":"802.11 b/g/n","GPIO":"11 pins"}',
 ARRAY['wifi','iot','popular'], true),

('Arduino Uno R3 (Compatible)', 'arduino-uno-r3', 'ATmega328P, 14 digital I/O, 6 analog inputs, CH340 USB', 249, 299, 'CK-MCU-UNO',
 (SELECT id FROM categories WHERE slug = 'microcontrollers'),
 '{"MCU":"ATmega328P","Clock":"16 MHz","Flash":"32KB","SRAM":"2KB","Digital I/O":"14 pins","Analog In":"6 pins"}',
 ARRAY['beginner','popular','arduino'], true),

('Arduino Nano V3 (Compatible)', 'arduino-nano-v3', 'ATmega328P, mini form factor, 22 I/O pins', 149, 179, 'CK-MCU-NANO',
 (SELECT id FROM categories WHERE slug = 'microcontrollers'),
 '{"MCU":"ATmega328P","Clock":"16 MHz","Flash":"32KB","I/O Pins":"22"}',
 ARRAY['beginner','compact','arduino'], false),

('Raspberry Pi Pico', 'raspberry-pi-pico', 'RP2040 dual-core ARM, 264KB SRAM, MicroPython ready', 349, 399, 'CK-MCU-PICO',
 (SELECT id FROM categories WHERE slug = 'microcontrollers'),
 '{"MCU":"RP2040","Cores":"Dual ARM Cortex-M0+","Clock":"133 MHz","SRAM":"264KB","Flash":"2MB","GPIO":"26 pins"}',
 ARRAY['micropython','popular'], false),

('STM32 Blue Pill (STM32F103C8T6)', 'stm32-bluepill', 'ARM Cortex-M3, 72MHz, 20KB SRAM, ST-Link compatible', 179, 219, 'CK-MCU-STM32',
 (SELECT id FROM categories WHERE slug = 'microcontrollers'),
 '{"MCU":"STM32F103C8T6","Core":"ARM Cortex-M3","Clock":"72 MHz","Flash":"64KB","SRAM":"20KB","GPIO":"32 pins"}',
 ARRAY['arm','stm32','advanced'], false);

-- Sensors
INSERT INTO products (name, slug, short_description, price, compare_price, sku, category_id, specifications, tags, is_featured)
VALUES
('DHT11 Temperature & Humidity Sensor', 'dht11-sensor', 'Digital temp & humidity, 3-5V, ±2°C accuracy', 59, 79, 'CK-SEN-DHT11',
 (SELECT id FROM categories WHERE slug = 'sensors'),
 '{"Type":"Digital","Temp Range":"0-50°C","Humidity Range":"20-90% RH","Accuracy":"±2°C / ±5% RH","Voltage":"3-5.5V","Protocol":"Single-wire"}',
 ARRAY['temperature','humidity','popular','beginner'], true),

('DHT22 Temperature & Humidity Sensor', 'dht22-sensor', 'High accuracy temp & humidity, -40 to 80°C, ±0.5°C', 149, 179, 'CK-SEN-DHT22',
 (SELECT id FROM categories WHERE slug = 'sensors'),
 '{"Type":"Digital","Temp Range":"-40 to 80°C","Humidity Range":"0-100% RH","Accuracy":"±0.5°C / ±2-5% RH","Voltage":"3.3-6V"}',
 ARRAY['temperature','humidity','precision'], false),

('HC-SR04 Ultrasonic Distance Sensor', 'hc-sr04-ultrasonic', '2cm-400cm range, 5V, 15° beam angle', 59, 79, 'CK-SEN-HCSR04',
 (SELECT id FROM categories WHERE slug = 'sensors'),
 '{"Range":"2cm - 400cm","Voltage":"5V DC","Current":"15mA","Frequency":"40Hz","Accuracy":"3mm"}',
 ARRAY['distance','ultrasonic','popular','beginner'], true),

('IR Infrared Obstacle Sensor Module', 'ir-obstacle-sensor', 'Adjustable detection 2-30cm, digital output, 5V', 39, 59, 'CK-SEN-IR',
 (SELECT id FROM categories WHERE slug = 'sensors'),
 '{"Range":"2-30cm adjustable","Output":"Digital","Voltage":"3.3-5V","LED":"Indicator included"}',
 ARRAY['ir','obstacle','robotics','beginner'], false),

('MPU-6050 Accelerometer + Gyroscope', 'mpu6050-imu', '6-axis IMU, I2C, ±2/4/8/16g, 3.3/5V', 99, 129, 'CK-SEN-MPU6050',
 (SELECT id FROM categories WHERE slug = 'sensors'),
 '{"Axes":"6 (3 accel + 3 gyro)","Interface":"I2C","Accel Range":"±2/4/8/16g","Gyro Range":"±250/500/1000/2000°/s","Voltage":"3-5V"}',
 ARRAY['imu','gyroscope','accelerometer','drone'], false),

('BMP280 Barometric Pressure + Temperature', 'bmp280-pressure-sensor', 'I2C/SPI, 300-1100 hPa, ±1 hPa accuracy', 89, 119, 'CK-SEN-BMP280',
 (SELECT id FROM categories WHERE slug = 'sensors'),
 '{"Interface":"I2C / SPI","Pressure Range":"300-1100 hPa","Accuracy":"±1 hPa","Temp Range":"-40 to 85°C","Voltage":"3.3-5V"}',
 ARRAY['pressure','weather','altitude'], false),

('Soil Moisture Sensor Module', 'soil-moisture-sensor', 'Analog + digital output, 3.3-5V, for plant monitoring', 49, 69, 'CK-SEN-SOIL',
 (SELECT id FROM categories WHERE slug = 'sensors'),
 '{"Output":"Analog + Digital","Voltage":"3.3-5V","Application":"Soil moisture detection"}',
 ARRAY['agriculture','iot','garden'], false),

('MQ-2 Gas / Smoke Sensor', 'mq2-gas-sensor', 'LPG, smoke, alcohol, propane detection, analog + digital', 89, 119, 'CK-SEN-MQ2',
 (SELECT id FROM categories WHERE slug = 'sensors'),
 '{"Detects":"LPG, Smoke, Alcohol, Propane","Output":"Analog + Digital","Voltage":"5V","Preheat":"20s"}',
 ARRAY['gas','smoke','safety'], false),

('MQ-135 Air Quality Sensor', 'mq135-air-quality', 'CO2, NH3, benzene, alcohol detection', 89, 119, 'CK-SEN-MQ135',
 (SELECT id FROM categories WHERE slug = 'sensors'),
 '{"Detects":"CO2, NH3, Benzene, Alcohol, Smoke","Output":"Analog + Digital","Voltage":"5V"}',
 ARRAY['air quality','gas','environment'], false);

-- Displays
INSERT INTO products (name, slug, short_description, price, compare_price, sku, category_id, specifications, tags, is_featured)
VALUES
('0.96" OLED Display I2C (128x64)', 'oled-096-i2c', 'SSD1306, I2C, 128x64px, 3.3-5V, white pixels', 129, 159, 'CK-DSP-OLED096',
 (SELECT id FROM categories WHERE slug = 'displays'),
 '{"Driver":"SSD1306","Interface":"I2C (addr 0x3C)","Resolution":"128x64","Size":"0.96 inch","Voltage":"3.3-5V","Color":"White"}',
 ARRAY['display','oled','popular'], true),

('16x2 LCD Display with I2C Adapter', 'lcd-16x2-i2c', 'HD44780 16x2, I2C backpack included, blue backlight', 99, 129, 'CK-DSP-LCD16X2',
 (SELECT id FROM categories WHERE slug = 'displays'),
 '{"Type":"Character LCD","Columns":"16","Rows":"2","Interface":"I2C (via PCF8574)","Backlight":"Blue/White","Voltage":"5V"}',
 ARRAY['display','lcd','beginner'], false),

('1.44" TFT Color Display SPI (128x128)', 'tft-144-spi', 'ST7735, SPI, 128x128 color, 3.3V', 149, 199, 'CK-DSP-TFT144',
 (SELECT id FROM categories WHERE slug = 'displays'),
 '{"Driver":"ST7735","Interface":"SPI","Resolution":"128x128","Colors":"65K (16-bit)","Voltage":"3.3V"}',
 ARRAY['display','tft','color'], false);

-- Power Management
INSERT INTO products (name, slug, short_description, price, compare_price, sku, category_id, specifications, tags, is_featured)
VALUES
('TP4056 Lithium Battery Charger Module', 'tp4056-charger', '1A Li-ion/LiPo charger, USB-C input, with protection', 39, 59, 'CK-PWR-TP4056',
 (SELECT id FROM categories WHERE slug = 'power-management'),
 '{"Input":"USB-C / Micro-USB","Charge Current":"1A max","Battery":"3.7V Li-ion/LiPo","Protection":"Overcharge, Overdischarge, Short circuit"}',
 ARRAY['battery','charger','popular'], true),

('LM7805 5V Voltage Regulator (TO-220)', 'lm7805-regulator', 'Fixed 5V output, 1A, TO-220 package', 19, 29, 'CK-PWR-LM7805',
 (SELECT id FROM categories WHERE slug = 'power-management'),
 '{"Output":"5V fixed","Max Current":"1A","Package":"TO-220","Input Range":"7-35V","Dropout":"2V"}',
 ARRAY['regulator','power','popular'], false),

('LM2596 DC-DC Buck Converter Module', 'lm2596-buck', 'Adjustable 1.25-35V out, 3A, with display', 69, 99, 'CK-PWR-LM2596',
 (SELECT id FROM categories WHERE slug = 'power-management'),
 '{"Input":"4-40V","Output":"1.25-35V adjustable","Max Current":"3A","Efficiency":"92%"}',
 ARRAY['buck','converter','power'], false),

('MT3608 DC-DC Boost Converter Module', 'mt3608-boost', '2-24V in, up to 28V out, 2A', 49, 69, 'CK-PWR-MT3608',
 (SELECT id FROM categories WHERE slug = 'power-management'),
 '{"Input":"2-24V","Output":"5-28V adjustable","Max Current":"2A","Efficiency":"93%"}',
 ARRAY['boost','converter','power'], false),

('XL4016 High Power Buck Converter', 'xl4016-buck-8a', '4-40V in, adjustable out, 8A max current', 89, 129, 'CK-PWR-XL4016',
 (SELECT id FROM categories WHERE slug = 'power-management'),
 '{"Input":"4-40V","Output":"1.25-36V adjustable","Max Current":"8A","Efficiency":"94%"}',
 ARRAY['buck','high power','converter'], false);

-- Motor & Relay Control
INSERT INTO products (name, slug, short_description, price, compare_price, sku, category_id, specifications, tags, is_featured)
VALUES
('L298N Dual H-Bridge Motor Driver', 'l298n-motor-driver', 'Dual DC motor / stepper, 2A per channel, 5-35V', 99, 129, 'CK-MOT-L298N',
 (SELECT id FROM categories WHERE slug = 'motor-relay'),
 '{"Motors":"2x DC or 1x Stepper","Current per channel":"2A","Motor Voltage":"5-35V","Logic Voltage":"5V","Interface":"TTL compatible"}',
 ARRAY['motor','driver','robotics','popular'], true),

('L293D Motor Driver IC (DIP-16)', 'l293d-ic', 'Quad half-H driver, 600mA per channel', 49, 69, 'CK-MOT-L293D',
 (SELECT id FROM categories WHERE slug = 'motor-relay'),
 '{"Package":"DIP-16","Current per channel":"600mA","Channels":"4 (2 full H-bridge)","Motor Voltage":"4.5-36V"}',
 ARRAY['motor','ic','driver'], false),

('1 Channel 5V Relay Module', 'relay-1ch-5v', '5V coil, 10A/250VAC, optocoupler isolated', 49, 69, 'CK-MOT-RELAY1',
 (SELECT id FROM categories WHERE slug = 'motor-relay'),
 '{"Coil":"5V DC","AC Rating":"250V/10A","DC Rating":"30V/10A","Isolation":"Optocoupler","Trigger":"Active LOW"}',
 ARRAY['relay','switching','iot'], false),

('4 Channel 5V Relay Module', 'relay-4ch-5v', '4x independent relays, 5V, optocoupler isolated', 129, 169, 'CK-MOT-RELAY4',
 (SELECT id FROM categories WHERE slug = 'motor-relay'),
 '{"Channels":"4","Coil":"5V DC","AC Rating":"250V/10A","Isolation":"Optocoupler"}',
 ARRAY['relay','switching','home automation'], false),

('A4988 Stepper Motor Driver Module', 'a4988-stepper-driver', 'Up to 1/16 microstepping, 2A max, with heatsink', 109, 149, 'CK-MOT-A4988',
 (SELECT id FROM categories WHERE slug = 'motor-relay'),
 '{"Max Current":"2A","Microstep":"Full, 1/2, 1/4, 1/8, 1/16","Motor Voltage":"8-35V","Logic Voltage":"3.3-5V"}',
 ARRAY['stepper','cnc','3dprinter','driver'], false);

-- Connectivity & Communication
INSERT INTO products (name, slug, short_description, price, compare_price, sku, category_id, specifications, tags, is_featured)
VALUES
('HC-05 Bluetooth Module', 'hc-05-bluetooth', 'Classic BT 2.0, UART, master/slave modes, AT commands', 199, 249, 'CK-CON-HC05',
 (SELECT id FROM categories WHERE slug = 'connectivity'),
 '{"Standard":"Bluetooth 2.0","Interface":"UART","Baud Rate":"9600 default","Mode":"Master/Slave","Range":"10m","Voltage":"3.3-6V"}',
 ARRAY['bluetooth','wireless','serial'], false),

('NRF24L01 2.4GHz RF Transceiver Module', 'nrf24l01-rf', '2.4GHz ISM band, SPI, 250kbps/1Mbps/2Mbps, 100m range', 89, 129, 'CK-CON-NRF24',
 (SELECT id FROM categories WHERE slug = 'connectivity'),
 '{"Frequency":"2.4 GHz","Interface":"SPI","Range":"up to 100m","Data Rate":"250kbps/1/2Mbps","Voltage":"1.9-3.6V"}',
 ARRAY['rf','wireless','long range'], false);

-- Prototyping & Tools
INSERT INTO products (name, slug, short_description, price, compare_price, sku, category_id, specifications, tags, is_featured)
VALUES
('400 Point Solderless Breadboard', 'breadboard-400', 'Half-size, 400 tie points, ABS, standard pitch', 49, 69, 'CK-PRO-BB400',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Points":"400","Pitch":"2.54mm","Material":"ABS","Dimensions":"83 x 55mm"}',
 ARRAY['prototyping','beginner','popular'], true),

('830 Point Solderless Breadboard', 'breadboard-830', 'Full-size, 830 tie points, 2 power rails each side', 79, 99, 'CK-PRO-BB830',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Points":"830","Pitch":"2.54mm","Power Rails":"4 (2 per side)"}',
 ARRAY['prototyping','beginner'], false),

('Jumper Wires Male-Male 40pc (20cm)', 'jumper-mm-40pc', '40 pieces, 20cm, 28AWG, assorted colors', 59, 79, 'CK-PRO-JMPMM',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Quantity":"40 pieces","Length":"20cm","Type":"Male-Male","AWG":"28"}',
 ARRAY['wires','prototyping','popular'], true),

('Jumper Wires Male-Female 40pc (20cm)', 'jumper-mf-40pc', '40 pieces, 20cm, for sensor connections', 59, 79, 'CK-PRO-JMPMF',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Quantity":"40 pieces","Length":"20cm","Type":"Male-Female"}',
 ARRAY['wires','prototyping','popular'], false),

('Jumper Wires Female-Female 40pc (20cm)', 'jumper-ff-40pc', '40 pieces, 20cm, for module-to-module', 59, 79, 'CK-PRO-JMPFF',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Quantity":"40 pieces","Length":"20cm","Type":"Female-Female"}',
 ARRAY['wires','prototyping'], false),

('40-Pin Male Header Strip (2.54mm)', 'male-header-40pin', 'Single row, breakable, gold-plated, pack of 5', 19, 29, 'CK-PRO-HDR40',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Pins":"40 per strip","Pitch":"2.54mm","Pack":"5 strips","Type":"Single row male"}',
 ARRAY['headers','pcb','prototyping'], false),

('Micro USB Cable 1m (Charging + Data)', 'micro-usb-cable-1m', 'Braided, 2.4A, data + charge, Arduino/NodeMCU compatible', 49, 79, 'CK-PRO-USBMICRO',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Length":"1 meter","Connector":"Micro USB Type-B","Current":"2.4A max","Type":"Braided"}',
 ARRAY['cable','usb','accessories'], false),

('USB Type-C Cable 1m', 'usbc-cable-1m', 'Braided, 3A, data + charge, TP4056 / ESP32 compatible', 59, 89, 'CK-PRO-USBC',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Length":"1 meter","Connector":"USB Type-C","Current":"3A max"}',
 ARRAY['cable','usb-c','accessories'], false),

('Resistor Kit (600pcs, 30 values)', 'resistor-kit-600pc', '30 values × 20pcs, 1/4W, 1% tolerance, with box', 99, 139, 'CK-PRO-RESKIT',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Total":"600 pieces","Values":"30 different (10Ω to 1MΩ)","Power":"1/4W","Tolerance":"1%"}',
 ARRAY['resistors','kit','beginner','popular'], false),

('LED Assorted Pack (100pcs, 5 colors)', 'led-assorted-100pc', '5mm, 100pcs — Red, Green, Blue, Yellow, White (20 each)', 79, 99, 'CK-PRO-LEDPACK',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Quantity":"100 pieces","Size":"5mm","Colors":"Red, Green, Blue, Yellow, White","Forward Voltage":"1.8-3.2V"}',
 ARRAY['led','beginner','popular'], false),

('Heatshrink Tube Kit (120pcs, 5 sizes)', 'heatshrink-kit', '5 diameters, 2:1 shrink ratio, black', 89, 119, 'CK-PRO-HEATSHRINK',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Total":"120 pieces","Sizes":"2mm, 3mm, 4mm, 6mm, 8mm","Ratio":"2:1","Color":"Black"}',
 ARRAY['wiring','finishing','tools'], false),

('PCB Standoff Spacer Kit (M3, 120pcs)', 'm3-standoff-kit', 'M3 male-female standoffs + screws + nuts, brass', 99, 139, 'CK-PRO-STANDOFF',
 (SELECT id FROM categories WHERE slug = 'prototyping'),
 '{"Thread":"M3","Material":"Brass","Lengths":"6mm, 8mm, 10mm, 12mm","Includes":"Screws + Nuts"}',
 ARRAY['pcb','mounting','hardware'], false);

-- Timing & Storage
INSERT INTO products (name, slug, short_description, price, compare_price, sku, category_id, specifications, tags, is_featured)
VALUES
('DS3231 RTC Module (High Accuracy)', 'ds3231-rtc', '±2ppm accuracy, I2C, battery backup, 3.3-5V', 119, 149, 'CK-TIM-DS3231',
 (SELECT id FROM categories WHERE slug = 'timing-storage'),
 '{"Accuracy":"±2ppm (0-40°C)","Interface":"I2C","Battery":"CR2032 (included)","Voltage":"3.3-5V","Features":"Temperature compensated"}',
 ARRAY['rtc','clock','timekeeping'], false),

('Micro SD Card Module', 'microsd-module', 'SPI interface, 3.3V/5V compatible, FAT16/FAT32', 49, 69, 'CK-TIM-MICROSD',
 (SELECT id FROM categories WHERE slug = 'timing-storage'),
 '{"Interface":"SPI","Voltage":"3.3-5V (onboard regulator)","Format":"FAT16 / FAT32","Card type":"Micro SD / SDHC"}',
 ARRAY['storage','data logging','spi'], false);

-- Lighting
INSERT INTO products (name, slug, short_description, price, compare_price, sku, category_id, specifications, tags, is_featured)
VALUES
('WS2812B RGB LED Strip (1m, 60 LEDs/m)', 'ws2812b-strip-1m', 'Individually addressable, 5V, IP30, 60 LEDs/meter', 299, 399, 'CK-LGT-WS2812B',
 (SELECT id FROM categories WHERE slug = 'lighting'),
 '{"LEDs":"60/meter","Length":"1 meter","Voltage":"5V DC","Control":"Single data wire","Protocol":"WS2812B","Waterproof":"IP30 (non-waterproof)"}',
 ARRAY['led strip','addressable','neopixel','lighting'], true);

-- ----------------------------------------------------------------
-- Default settings
-- ----------------------------------------------------------------
INSERT INTO settings (key, value, updated_at) VALUES
('site_name', 'Circuitkar', now()),
('announcement_text', '🚀 Launching Soon — Click ''Notify Me'' on products you want!', now()),
('announcement_enabled', 'true', now()),
('free_shipping_threshold', '499', now()),
('razorpay_live', 'false', now()),
('admin_email', '', now()),
('whatsapp_number', '91XXXXXXXXXX', now());
