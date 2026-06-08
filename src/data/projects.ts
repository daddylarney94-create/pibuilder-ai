export interface SavedProject {
  id: string;
  name: string;
  piId: string;
  componentIds: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
  description?: string;
  tags?: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  piId: string;
  componentIds: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedCost: string;
  buildTime: string;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'weather-station',
    name: 'Weather Station',
    description: 'Monitor temperature, humidity, and barometric pressure with a live OLED display. Perfect first project.',
    icon: '🌤️',
    tags: ['sensor', 'display', 'beginner'],
    piId: 'pizero2',
    componentIds: ['dht22', 'bmp280', 'oled'],
    difficulty: 'Beginner',
    estimatedCost: '£28–£35',
    buildTime: '1–2 hours',
  },
  {
    id: 'security-camera',
    name: 'Security Camera',
    description: 'Motion-triggered camera with PIR sensor, LED indicator, and buzzer alert. Records clips on motion detection.',
    icon: '📷',
    tags: ['security', 'motion', 'intermediate'],
    piId: 'pi4',
    componentIds: ['pir', 'led_simple', 'buzzer', 'relay'],
    difficulty: 'Intermediate',
    estimatedCost: '£45–£60',
    buildTime: '2–3 hours',
  },
  {
    id: 'smart-doorbell',
    name: 'Smart Doorbell',
    description: 'Capacitive touch doorbell with buzzer chime, LED ring visual indicator, and OLED display for messages.',
    icon: '🔔',
    tags: ['home', 'touch', 'beginner'],
    piId: 'pizero2',
    componentIds: ['capacitive_touch', 'buzzer', 'ws2812_ring', 'oled'],
    difficulty: 'Beginner',
    estimatedCost: '£32–£42',
    buildTime: '1–2 hours',
  },
  {
    id: 'sdr-receiver',
    name: 'SDR Receiver',
    description: 'Full software-defined radio setup with Pluto+ SDR, bandpass filtering, LNA amplification, and directional antenna.',
    icon: '📻',
    tags: ['sdr', 'rf', 'advanced'],
    piId: 'pi4',
    componentIds: ['pluto_sdr', 'rf_bandpass', 'rf_amplifier', 'patch_antenna'],
    difficulty: 'Advanced',
    estimatedCost: '£180–£250',
    buildTime: '4–6 hours',
  },
  {
    id: 'greenhouse-monitor',
    name: 'Greenhouse Monitor',
    description: 'Soil moisture, temperature, and light monitoring with relay control for automated watering and grow lights.',
    icon: '🌱',
    tags: ['garden', 'automation', 'intermediate'],
    piId: 'pi3b',
    componentIds: ['soilmoisture', 'dht22', 'ldr', 'relay', 'lcd1602'],
    difficulty: 'Intermediate',
    estimatedCost: '£38–£52',
    buildTime: '2–4 hours',
  },
  {
    id: 'led-volume-knob',
    name: 'LED Volume Knob',
    description: 'Rotary encoder controls WS2812B LED strip brightness and colour. Satisfying tactile control with visual feedback.',
    icon: '🎛️',
    tags: ['leds', 'audio', 'beginner'],
    piId: 'pizero2',
    componentIds: ['rotary', 'ws2812', 'button'],
    difficulty: 'Beginner',
    estimatedCost: '£22–£30',
    buildTime: '1 hour',
  },
  {
    id: 'access-control',
    name: 'RFID Access Control',
    description: 'RFID card reader with relay-controlled door lock, LED status indicator, and buzzer feedback.',
    icon: '🔐',
    tags: ['security', 'rfid', 'intermediate'],
    piId: 'pi3b',
    componentIds: ['rfid', 'relay', 'rgb_led', 'buzzer'],
    difficulty: 'Intermediate',
    estimatedCost: '£35–£48',
    buildTime: '2–3 hours',
  },
  {
    id: 'air-quality',
    name: 'Air Quality Monitor',
    description: 'Gas and smoke detection with MQ-2 sensor, OLED display readout, and buzzer alarm when thresholds exceeded.',
    icon: '💨',
    tags: ['safety', 'sensor', 'beginner'],
    piId: 'pizero2',
    componentIds: ['mq2', 'oled', 'buzzer', 'led_simple'],
    difficulty: 'Beginner',
    estimatedCost: '£25–£35',
    buildTime: '1–2 hours',
  },
];

// Pricing data per component (GBP, approximate retail)
export const COMPONENT_PRICES: Record<string, { price: number; supplier: string; url: string; affiliate?: string }> = {
  'ws2812':           { price: 4.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=WS2812B+LED+strip&tag=pibuilder-21' },
  'ws2812_ring':      { price: 3.49,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=WS2812B+LED+ring+8bit&tag=pibuilder-21' },
  'dht22':            { price: 3.99,  supplier: 'Pimoroni',  url: 'https://shop.pimoroni.com/products/dht22-temperature-humidity-sensor' },
  'oled':             { price: 4.50,  supplier: 'Pimoroni',  url: 'https://shop.pimoroni.com/products/0-96-ssd1306-oled-display' },
  'button':           { price: 0.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=tactile+push+button+raspberry+pi&tag=pibuilder-21' },
  'buzzer':           { price: 1.49,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=piezo+buzzer+raspberry+pi&tag=pibuilder-21' },
  'relay':            { price: 2.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=5v+relay+module+raspberry+pi&tag=pibuilder-21' },
  'ultrasonic':       { price: 2.49,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=HC-SR04+ultrasonic+sensor&tag=pibuilder-21' },
  'rotary':           { price: 1.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=KY-040+rotary+encoder&tag=pibuilder-21' },
  'rfid':             { price: 4.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=MFRC522+RFID+reader&tag=pibuilder-21' },
  'servo':            { price: 3.99,  supplier: 'Pimoroni',  url: 'https://shop.pimoroni.com/products/sg90-servo-motor' },
  'pir':              { price: 2.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=HC-SR501+PIR+motion+sensor&tag=pibuilder-21' },
  'potentiometer':    { price: 3.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=MCP3008+ADC+potentiometer&tag=pibuilder-21' },
  'lcd1602':          { price: 5.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=LCD+1602+I2C+backpack&tag=pibuilder-21' },
  'stepper':          { price: 5.49,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=28BYJ-48+stepper+motor+ULN2003&tag=pibuilder-21' },
  'irrecv':           { price: 1.49,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=VS1838B+IR+receiver&tag=pibuilder-21' },
  'soilmoisture':     { price: 1.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=soil+moisture+sensor+raspberry+pi&tag=pibuilder-21' },
  'gps':              { price: 9.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=NEO-6M+GPS+module+raspberry+pi&tag=pibuilder-21' },
  'bmp280':           { price: 3.49,  supplier: 'Pimoroni',  url: 'https://shop.pimoroni.com/products/bmp280-breakout' },
  'led_simple':       { price: 0.49,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=5mm+LED+assorted&tag=pibuilder-21' },
  'rgb_led':          { price: 0.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=RGB+LED+common+cathode&tag=pibuilder-21' },
  'capacitive_touch': { price: 1.49,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=TTP223+capacitive+touch+sensor&tag=pibuilder-21' },
  'mq2':              { price: 2.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=MQ-2+gas+smoke+sensor&tag=pibuilder-21' },
  'max7219':          { price: 4.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=MAX7219+LED+matrix+8x8&tag=pibuilder-21' },
  'ldr':              { price: 0.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=LDR+light+dependent+resistor&tag=pibuilder-21' },
  'pluto_sdr':        { price: 149.00,supplier: 'Digi-Key',  url: 'https://www.digikey.co.uk/en/products/detail/analog-devices-inc/ADALM-PLUTO/6829004' },
  'rf_bandpass':      { price: 18.99, supplier: 'Digi-Key',  url: 'https://www.digikey.co.uk/en/products/filter/rf-filters-saw/875' },
  'rf_amplifier':     { price: 14.99, supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=LNA+36dB+RF+amplifier+SDR&tag=pibuilder-21' },
  'sdr_antenna_cp':   { price: 19.99, supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=circular+polarized+antenna+SMA&tag=pibuilder-21' },
  'patch_antenna':    { price: 12.99, supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=patch+directional+antenna+SMA&tag=pibuilder-21' },
  'buck_converter':   { price: 4.99,  supplier: 'Amazon',    url: 'https://www.amazon.co.uk/s?k=LM2596+buck+converter+DC+DC&tag=pibuilder-21' },
};

export const PI_PRICES: Record<string, { price: number; url: string }> = {
  'pi5':     { price: 67.00, url: 'https://www.raspberrypi.com/products/raspberry-pi-5/' },
  'pi4':     { price: 54.00, url: 'https://www.raspberrypi.com/products/raspberry-pi-4-model-b/' },
  'pi3b':    { price: 38.00, url: 'https://www.raspberrypi.com/products/raspberry-pi-3-model-b-plus/' },
  'pizero2': { price: 15.00, url: 'https://www.raspberrypi.com/products/raspberry-pi-zero-2-w/' },
};

// Extras always needed
export const ESSENTIALS = [
  { name: 'MicroSD Card (16GB+)', price: 6.99, url: 'https://www.amazon.co.uk/s?k=microsd+card+16gb+raspberry+pi&tag=pibuilder-21' },
  { name: 'Jumper Wires (pack)', price: 2.99, url: 'https://www.amazon.co.uk/s?k=jumper+wires+breadboard&tag=pibuilder-21' },
  { name: 'Breadboard', price: 3.49, url: 'https://www.amazon.co.uk/s?k=breadboard+400+point&tag=pibuilder-21' },
];
