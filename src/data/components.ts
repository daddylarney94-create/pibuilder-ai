export interface WiringStep {
  from: string;
  to: string;
  color: string;
}

export interface ComponentDef {
  id: string;
  name: string;
  category: string;
  icon: string;
  power: string;
  current_ma: number;
  pins: string[];
  recommended_gpio: (number | string)[];
  requires_resistor: { value: string; placement: string } | null;
  requires_capacitor: { value: string; placement: string } | null;
  color: string;
  notes: string;
  library: string;
  i2c?: boolean;
  spi?: boolean;
  usb?: boolean;
  code: { gpiozero: string; rpigpio: string };
  wiring: WiringStep[];
}

export const COMPONENT_DB: ComponentDef[] = [
  // ── SDR / RF ───────────────────────────────────────────────────────────────
  {
    id: 'pluto_sdr',
    name: 'ADALM-Pluto+ SDR',
    category: 'SDR/RF',
    icon: '📻',
    power: 'USB (900mA)',
    current_ma: 900,
    pins: ['USB / Ethernet'],
    recommended_gpio: [],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#e11d48',
    usb: true,
    notes: 'Does NOT use GPIO pins. Connects via USB or Ethernet. Covers 70MHz–6GHz TX/RX. Requires libiio + PlutoSDR firmware. Two units needed for full-duplex.',
    library: 'pylibiio',
    code: {
      gpiozero: `# Install: pip install pylibiio
# Also: sudo apt install libiio-utils
import iio
import numpy as np

ctx = iio.Context("ip:192.168.2.1")  # Default USB IP
phy = ctx.find_device("ad9361-phy")
rx  = ctx.find_device("cf-ad9361-lpc")

# Tune to 433 MHz, 2 MHz bandwidth
phy.find_channel("altvoltage0", True).attrs["frequency"].value = str(433_000_000)
phy.find_channel("voltage0").attrs["rf_bandwidth"].value       = str(2_000_000)
phy.find_channel("voltage0").attrs["sampling_frequency"].value = str(2_600_000)

# Capture IQ samples
rxbuf = iio.Buffer(rx, 1024, False)
rxbuf.refill()
samples = np.frombuffer(rxbuf.read(), dtype=np.int16)
iq = samples[0::2] + 1j * samples[1::2]
print(f"Captured {len(iq)} IQ samples")
print(f"Peak amplitude: {np.abs(iq).max():.1f}")`,
      rpigpio: `# GNU Radio Python flowgraph
# Install: sudo apt install gnuradio gr-iio
from gnuradio import gr, blocks
from gnuradio.iio import pluto_source

class PlutoReceiver(gr.top_block):
    def __init__(self):
        gr.top_block.__init__(self)
        src = pluto_source(
            uri="ip:192.168.2.1",
            frequency=433_000_000,
            samplerate=2_600_000,
            bandwidth=2_000_000,
            buffer_size=0x8000,
            quadrature=True,
            rfdc=True, bbdc=True,
            filter_source="Auto",
            filter_filename="",
            fpass=0.5, fstop=0.6,
            gain_mode="manual", gain=50
        )
        sink = blocks.file_sink(gr.sizeof_gr_complex, "capture.iq")
        self.connect(src, sink)

tb = PlutoReceiver()
tb.run()`,
    },
    wiring: [
      { from: 'Pi USB Port', to: 'Pluto+ USB connector (powers device)', color: '#e11d48' },
      { from: 'Pluto+ SMA TX1', to: 'RF Amplifier input OR TX antenna', color: '#f43f5e' },
      { from: 'Pluto+ SMA RX1', to: 'Circular polarized or patch antenna', color: '#fb7185' },
      { from: 'Optional: Pi Ethernet', to: 'Pluto+ Ethernet (faster than USB)', color: '#fda4af' },
    ],
  },
  {
    id: 'rf_bandpass',
    name: 'RF Bandpass Filter',
    category: 'SDR/RF',
    icon: '🔻',
    power: 'Passive',
    current_ma: 0,
    pins: ['SMA IN', 'SMA OUT'],
    recommended_gpio: [],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#d97706',
    usb: true,
    notes: 'Passive inline SMA filter. Rejects out-of-band interference. Place between antenna and SDR RX input. Common: 433MHz, 1.8GHz, 2.4GHz.',
    library: 'n/a',
    code: {
      gpiozero: `# Passive hardware — no code needed.
# Correct RF chain:
# [Antenna] → [BPF] → [LNA] → [Pluto+ RX]
#
# Verify filter specs:
#   Insertion loss < 3dB in passband
#   Rejection > 30dB outside passband
print("Passive hardware — no software required.")`,
      rpigpio: `# No GPIO or code required.
# Hardware-only inline SMA component.`,
    },
    wiring: [
      { from: 'Antenna SMA output', to: 'Filter SMA IN port', color: '#d97706' },
      { from: 'Filter SMA OUT port', to: 'SDR RX SMA input (or LNA input)', color: '#fbbf24' },
    ],
  },
  {
    id: 'rf_amplifier',
    name: 'RF LNA Amplifier (36dB)',
    category: 'SDR/RF',
    icon: '📶',
    power: '5V USB',
    current_ma: 180,
    pins: ['USB 5V power', 'SMA IN', 'SMA OUT'],
    recommended_gpio: [],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#7c3aed',
    usb: true,
    notes: 'Low Noise Amplifier. Place between BPF and SDR RX. Do NOT use on TX path — will be destroyed. Powered via USB micro.',
    library: 'n/a',
    code: {
      gpiozero: `# LNA is passive — no code required.
# RF chain: [Antenna] → [BPF] → [LNA +36dB] → [Pluto+ RX]
#
# Reduce Pluto hardware gain to compensate for LNA:
import iio
ctx = iio.Context("ip:192.168.2.1")
phy = ctx.find_device("ad9361-phy")
phy.find_channel("voltage0").attrs["hardwaregain"].value = "10"`,
      rpigpio: `# No GPIO required.
# USB powered, inline SMA.`,
    },
    wiring: [
      { from: 'Pi USB Port (or USB charger)', to: 'LNA USB Micro power input', color: '#7c3aed' },
      { from: 'Antenna / BPF SMA out', to: 'LNA SMA IN', color: '#a78bfa' },
      { from: 'LNA SMA OUT', to: 'Pluto+ RX SMA input', color: '#c4b5fd' },
    ],
  },
  {
    id: 'sdr_antenna_cp',
    name: 'Circular Polarized Antenna',
    category: 'SDR/RF',
    icon: '🌀',
    power: 'Passive',
    current_ma: 0,
    pins: ['SMA connector'],
    recommended_gpio: [],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#0d9488',
    usb: true,
    notes: 'Rejects multipath interference. Good for satellites, drones, weather balloons. Match RHCP/LHCP to target. SMA male connector.',
    library: 'n/a',
    code: {
      gpiozero: `# Passive antenna — no code needed.
# Applications:
#   ADS-B aircraft tracking  → 1090 MHz
#   Weather satellite NOAA   → 137 MHz
#   Drone video/telemetry    → 5.8 GHz
#   GPS verification         → 1575.42 MHz`,
      rpigpio: `# SMA connects directly to SDR RX port.`,
    },
    wiring: [
      { from: 'Antenna SMA', to: 'Pluto+ RX1 (direct or via LNA/BPF chain)', color: '#0d9488' },
    ],
  },
  {
    id: 'patch_antenna',
    name: 'Patch / Directional Antenna',
    category: 'SDR/RF',
    icon: '🔭',
    power: 'Passive',
    current_ma: 0,
    pins: ['SMA connector'],
    recommended_gpio: [],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#0369a1',
    usb: true,
    notes: 'Flat directional ~7–9dBi gain antenna. Aim boresight at target. Good for fixed installations, point-to-point, directional scanning. 800MHz–3GHz.',
    library: 'n/a',
    code: {
      gpiozero: `# Directional antenna — no code needed.
# Read RSSI while aiming to maximise signal:
import iio, time
ctx = iio.Context("ip:192.168.2.1")
phy = ctx.find_device("ad9361-phy")
while True:
    rssi = phy.find_channel("voltage0").attrs["rssi"].value
    print(f"RSSI: {rssi} dBFS")
    time.sleep(0.5)`,
      rpigpio: `# No GPIO required.`,
    },
    wiring: [
      { from: 'Patch antenna SMA', to: 'BPF IN → LNA IN → Pluto+ RX1', color: '#0369a1' },
    ],
  },
  // ── Power ──────────────────────────────────────────────────────────────────
  {
    id: 'buck_converter',
    name: 'Buck Converter (DC-DC)',
    category: 'Power',
    icon: '🔋',
    power: 'Input 4–40V → Output adjustable',
    current_ma: 3000,
    pins: ['VIN+', 'VIN-', 'VOUT+', 'VOUT-'],
    recommended_gpio: [],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#15803d',
    usb: true,
    notes: 'Adjustable step-down (XL4016/LM2596). Set output with trim pot BEFORE connecting load. Set to 5.1V for Pi. Measure with multimeter first.',
    library: 'n/a',
    code: {
      gpiozero: `# Hardware only — no code required.
# Setup:
#   1. Connect input to VIN+ / VIN-
#   2. Adjust trim pot with NO load
#   3. Measure VOUT — set to 5.1V
#   4. Connect to Pi 5V + GND pins

# Check Pi voltage from software:
import subprocess
r = subprocess.run(['vcgencmd', 'measure_volts'], capture_output=True, text=True)
print(f"Core voltage: {r.stdout.strip()}")

r2 = subprocess.run(['vcgencmd', 'get_throttled'], capture_output=True, text=True)
t = int(r2.stdout.split('=')[1], 16)
if t & 0x1:
    print("⚠️  Under-voltage — increase buck output slightly")`,
      rpigpio: `# No GPIO wiring required.`,
    },
    wiring: [
      { from: 'Battery / PSU positive', to: 'Buck converter VIN+', color: '#ef4444' },
      { from: 'Battery / PSU negative', to: 'Buck converter VIN-', color: '#6b7280' },
      { from: 'Buck VOUT+ (set 5.1V)', to: 'Pi 5V pin (Pin 2 or Pin 4)', color: '#15803d' },
      { from: 'Buck VOUT-', to: 'Pi GND (Pin 6)', color: '#374151' },
    ],
  },
  // ── Output ─────────────────────────────────────────────────────────────────
  {
    id: 'ws2812_ring',
    name: 'WS2812B LED Ring (8-bit)',
    category: 'Output',
    icon: '🔵',
    power: '5V',
    current_ma: 48,
    pins: ['5V', 'GND', 'DI'],
    recommended_gpio: [13, 18, 12],
    requires_resistor: { value: '470Ω', placement: 'between GPIO and DI (Data In)' },
    requires_capacitor: { value: '100µF', placement: 'across 5V and GND near ring' },
    color: '#6366f1',
    notes: 'GPIO13 (hardware PWM) recommended. Daisy-chain: D0 of one ring → DI of next ring.',
    library: 'rpi_ws281x',
    code: {
      gpiozero: `import board
import neopixel
import time

pixels = neopixel.NeoPixel(board.D{GPIO}, 8, brightness=0.5)

while True:
    for i in range(8):
        pixels.fill((0, 0, 0))
        pixels[i] = (0, 150, 255)
        time.sleep(0.1)`,
      rpigpio: `import board
import neopixel
import time

pixels = neopixel.NeoPixel(board.D{GPIO}, 8)
for i in range(8):
    pixels[i] = (255 - i*30, 0, i*30)
time.sleep(2)
pixels.fill((0, 0, 0))`,
    },
    wiring: [
      { from: '5V', to: 'Ring VCC', color: '#ef4444' },
      { from: 'GND', to: 'Ring GND', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'Ring DI via 470Ω resistor', color: '#6366f1' },
    ],
  },
  {
    id: 'ws2812',
    name: 'WS2812B LED Strip',
    category: 'Output',
    icon: '💡',
    power: '5V',
    current_ma: 60,
    pins: ['5V', 'GND', 'DATA'],
    recommended_gpio: [18, 12, 21],
    requires_resistor: { value: '470Ω', placement: 'between GPIO and Data In' },
    requires_capacitor: { value: '470µF', placement: 'across 5V and GND' },
    color: '#f59e0b',
    notes: 'GPIO18 supports hardware PWM (required for NeoPixels). Daisy-chain: D0 of strip → DI of next.',
    library: 'rpi_ws281x',
    code: {
      gpiozero: `import board
import neopixel

pixels = neopixel.NeoPixel(board.D{GPIO}, 30)
pixels.fill((255, 0, 0))  # Red`,
      rpigpio: `import board
import neopixel

pixels = neopixel.NeoPixel(board.D{GPIO}, 30, brightness=0.5)
for i in range(len(pixels)):
    pixels[i] = (0, 255, 0)`,
    },
    wiring: [
      { from: '5V', to: 'Strip 5V (Red)', color: '#ef4444' },
      { from: 'GND', to: 'Strip GND (Black)', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'Strip Data (Green) via 470Ω resistor', color: '#22c55e' },
    ],
  },
  {
    id: 'oled',
    name: 'SSD1306 OLED Display',
    category: 'Output',
    icon: '🖥️',
    power: '3.3V',
    current_ma: 20,
    pins: ['3.3V', 'GND', 'SDA', 'SCL'],
    recommended_gpio: ['SDA(GPIO2)', 'SCL(GPIO3)'],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#06b6d4',
    i2c: true,
    notes: 'I2C (fixed: SDA=GPIO2, SCL=GPIO3). Default address 0x3C. Multiple I2C devices can share the bus.',
    library: 'luma.oled',
    code: {
      gpiozero: `from luma.core.interface.serial import i2c
from luma.oled.device import ssd1306
from luma.core.render import canvas

serial = i2c(port=1, address=0x3C)
device = ssd1306(serial)

with canvas(device) as draw:
    draw.rectangle(device.bounding_box, outline="white", fill="black")
    draw.text((10, 10), "PiBuilder AI", fill="white")`,
      rpigpio: `from luma.core.interface.serial import i2c
from luma.oled.device import ssd1306
from luma.core.render import canvas

serial = i2c(port=1, address=0x3C)
device = ssd1306(serial)

with canvas(device) as draw:
    draw.text((0, 0), "Hello World!", fill="white")`,
    },
    wiring: [
      { from: '3.3V', to: 'OLED VCC', color: '#f97316' },
      { from: 'GND', to: 'OLED GND', color: '#6b7280' },
      { from: 'GPIO2 (SDA)', to: 'OLED SDA', color: '#06b6d4' },
      { from: 'GPIO3 (SCL)', to: 'OLED SCL', color: '#a855f7' },
    ],
  },
  {
    id: 'lcd1602',
    name: 'LCD 1602 (I2C Backpack)',
    category: 'Output',
    icon: '📟',
    power: '5V',
    current_ma: 120,
    pins: ['5V', 'GND', 'SDA', 'SCL'],
    recommended_gpio: ['SDA(GPIO2)', 'SCL(GPIO3)'],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#10b981',
    i2c: true,
    notes: 'I2C backpack (PCF8574). Default address 0x27. Run: i2cdetect -y 1 to confirm.',
    library: 'RPLCD',
    code: {
      gpiozero: `from RPLCD.i2c import CharLCD
import time

lcd = CharLCD('PCF8574', 0x27)
lcd.write_string("PiBuilder AI")
lcd.cursor_pos = (1, 0)
lcd.write_string("Hello World!")
time.sleep(5)
lcd.clear()`,
      rpigpio: `from RPLCD.i2c import CharLCD

lcd = CharLCD('PCF8574', address=0x27, port=1, cols=16, rows=2)
lcd.clear()
lcd.write_string("Raspberry Pi")
lcd.cursor_pos = (1, 0)
lcd.write_string("Ready!")`,
    },
    wiring: [
      { from: '5V', to: 'LCD backpack VCC', color: '#ef4444' },
      { from: 'GND', to: 'LCD backpack GND', color: '#6b7280' },
      { from: 'GPIO2 (SDA)', to: 'LCD backpack SDA', color: '#10b981' },
      { from: 'GPIO3 (SCL)', to: 'LCD backpack SCL', color: '#34d399' },
    ],
  },
  {
    id: 'servo',
    name: 'SG90 Servo Motor',
    category: 'Output',
    icon: '⚙️',
    power: '5V',
    current_ma: 500,
    pins: ['5V', 'GND', 'PWM'],
    recommended_gpio: [18, 12, 13],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#10b981',
    notes: 'Requires PWM-capable GPIO. GPIO18 recommended. Heavy loads need external 5V supply.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import Servo
from time import sleep

servo = Servo({GPIO})

servo.min()   # Full left
sleep(1)
servo.mid()   # Centre
sleep(1)
servo.max()   # Full right
sleep(1)`,
      rpigpio: `import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.OUT)
pwm = GPIO.PWM({GPIO}, 50)
pwm.start(7.5)

try:
    pwm.ChangeDutyCycle(2.5)   # Left
    time.sleep(1)
    pwm.ChangeDutyCycle(12.5)  # Right
    time.sleep(1)
finally:
    pwm.stop()
    GPIO.cleanup()`,
    },
    wiring: [
      { from: '5V', to: 'Servo Red (Power)', color: '#ef4444' },
      { from: 'GND', to: 'Servo Brown/Black (GND)', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'Servo Orange/Yellow (Signal)', color: '#10b981' },
    ],
  },
  {
    id: 'buzzer',
    name: 'Piezo Buzzer',
    category: 'Output',
    icon: '🔔',
    power: '3.3V',
    current_ma: 30,
    pins: ['GPIO', 'GND'],
    recommended_gpio: [18, 12, 23, 24, 25],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#f59e0b',
    notes: 'Active buzzers: HIGH signal = beep. Passive buzzers: need PWM for tone control.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import ToneBuzzer
from time import sleep

buzzer = ToneBuzzer({GPIO})
buzzer.play(440)  # A4
sleep(0.5)
buzzer.stop()`,
      rpigpio: `import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.OUT)
pwm = GPIO.PWM({GPIO}, 440)
pwm.start(50)
time.sleep(0.5)
pwm.stop()
GPIO.cleanup()`,
    },
    wiring: [
      { from: 'GPIO{GPIO}', to: 'Buzzer + (positive)', color: '#f59e0b' },
      { from: 'GND', to: 'Buzzer - (negative)', color: '#6b7280' },
    ],
  },
  {
    id: 'relay',
    name: '5V Relay Module',
    category: 'Output',
    icon: '⚡',
    power: '5V',
    current_ma: 70,
    pins: ['5V', 'GND', 'IN'],
    recommended_gpio: [17, 22, 27, 23, 24],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#ef4444',
    notes: '⚠️ Can switch mains voltage — use extreme caution. GPIO LOW typically activates most relay modules.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import OutputDevice
from time import sleep

relay = OutputDevice({GPIO}, active_high=False)
relay.on()   # Energise
sleep(1)
relay.off()  # De-energise`,
      rpigpio: `import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.OUT)
GPIO.output({GPIO}, GPIO.LOW)   # Relay ON
time.sleep(1)
GPIO.output({GPIO}, GPIO.HIGH)  # Relay OFF
GPIO.cleanup()`,
    },
    wiring: [
      { from: '5V', to: 'Relay VCC', color: '#ef4444' },
      { from: 'GND', to: 'Relay GND', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'Relay IN', color: '#f97316' },
    ],
  },
  {
    id: 'led_simple',
    name: 'LED (Single)',
    category: 'Output',
    icon: '🔆',
    power: '3.3V',
    current_ma: 10,
    pins: ['GPIO', 'GND'],
    recommended_gpio: [17, 22, 27, 23, 24, 25, 5, 6, 16, 19, 20, 21, 26],
    requires_resistor: { value: '220Ω–330Ω', placement: 'in series between GPIO and LED anode (+)' },
    requires_capacitor: null,
    color: '#facc15',
    notes: 'Always use current-limiting resistor. Red/Yellow ~2V forward, Blue/White ~3.2V. 220Ω safe for 3.3V GPIO.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import LED
from time import sleep

led = LED({GPIO})
led.blink(on_time=0.5, off_time=0.5, n=5)
sleep(5)`,
      rpigpio: `import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.OUT)
for _ in range(5):
    GPIO.output({GPIO}, GPIO.HIGH)
    time.sleep(0.5)
    GPIO.output({GPIO}, GPIO.LOW)
    time.sleep(0.5)
GPIO.cleanup()`,
    },
    wiring: [
      { from: 'GPIO{GPIO}', to: '220Ω resistor → LED Anode (+, longer leg)', color: '#facc15' },
      { from: 'GND', to: 'LED Cathode (-, shorter leg)', color: '#6b7280' },
    ],
  },
  {
    id: 'rgb_led',
    name: 'RGB LED (Common Cathode)',
    category: 'Output',
    icon: '🌈',
    power: '3.3V',
    current_ma: 30,
    pins: ['R→GPIO', 'G→GPIO', 'B→GPIO', 'GND'],
    recommended_gpio: [17, 27, 22],
    requires_resistor: { value: '220Ω × 3', placement: 'one on each R, G, B pin' },
    requires_capacitor: null,
    color: '#e879f9',
    notes: 'Common cathode: shared GND. Use RGBLED gpiozero class for easy colour mixing.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import RGBLED
from time import sleep

led = RGBLED(red={GPIO}, green={GPIO+1}, blue={GPIO+2})
led.color = (1, 0, 0)   # Red
sleep(1)
led.color = (0, 1, 0)   # Green
sleep(1)
led.color = (0, 0, 1)   # Blue
sleep(1)`,
      rpigpio: `import RPi.GPIO as GPIO
import time

R, G, B = {GPIO}, {GPIO+1}, {GPIO+2}
GPIO.setmode(GPIO.BCM)
for p in [R, G, B]: GPIO.setup(p, GPIO.OUT)
for r, g, b in [(1,0,0),(0,1,0),(0,0,1),(1,1,0)]:
    GPIO.output(R, r); GPIO.output(G, g); GPIO.output(B, b)
    time.sleep(0.8)
GPIO.cleanup()`,
    },
    wiring: [
      { from: 'GPIO{GPIO}', to: '220Ω → LED Red pin', color: '#ef4444' },
      { from: 'GPIO{GPIO+1}', to: '220Ω → LED Green pin', color: '#22c55e' },
      { from: 'GPIO{GPIO+2}', to: '220Ω → LED Blue pin', color: '#3b82f6' },
      { from: 'GND', to: 'LED Common Cathode (longest pin)', color: '#6b7280' },
    ],
  },
  {
    id: 'max7219',
    name: 'MAX7219 LED Matrix (8×8)',
    category: 'Output',
    icon: '🟥',
    power: '5V',
    current_ma: 320,
    pins: ['5V', 'GND', 'DIN', 'CS', 'CLK'],
    recommended_gpio: ['SPI: GPIO10(MOSI), GPIO8(CE0), GPIO11(SCLK)'],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#f87171',
    spi: true,
    notes: 'SPI-driven 8×8 matrix. Chainable. Set ISET resistor (~33kΩ) to limit max brightness.',
    library: 'luma.led_matrix',
    code: {
      gpiozero: `from luma.led_matrix.device import max7219
from luma.core.interface.serial import spi, noop
from luma.core.render import canvas
import time

serial = spi(port=0, device=0, gpio=noop())
device = max7219(serial, cascaded=1)

with canvas(device) as draw:
    draw.text((0, 0), "Hi!", fill="white")
time.sleep(2)`,
      rpigpio: `from luma.led_matrix.device import max7219
from luma.core.interface.serial import spi, noop
from luma.core.render import canvas

serial = spi(port=0, device=0, gpio=noop())
device = max7219(serial, cascaded=1, block_orientation=-90)

with canvas(device) as draw:
    draw.rectangle(device.bounding_box, outline="white")`,
    },
    wiring: [
      { from: '5V', to: 'MAX7219 VCC', color: '#ef4444' },
      { from: 'GND', to: 'MAX7219 GND', color: '#6b7280' },
      { from: 'GPIO10 (MOSI)', to: 'MAX7219 DIN', color: '#f87171' },
      { from: 'GPIO8 (CE0)', to: 'MAX7219 CS', color: '#fca5a5' },
      { from: 'GPIO11 (SCLK)', to: 'MAX7219 CLK', color: '#fed7aa' },
    ],
  },
  {
    id: 'stepper',
    name: 'Stepper Motor (28BYJ-48)',
    category: 'Output',
    icon: '🔩',
    power: '5V',
    current_ma: 240,
    pins: ['5V', 'GND', 'IN1', 'IN2', 'IN3', 'IN4'],
    recommended_gpio: [17, 18, 27, 22],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#ec4899',
    notes: 'Uses ULN2003 driver board — never connect motor directly to GPIO. 4-phase, 512 steps/rev full-step.',
    library: 'gpiozero',
    code: {
      gpiozero: `import RPi.GPIO as GPIO
import time

IN1, IN2, IN3, IN4 = {GPIO}, {GPIO+1}, {GPIO+2}, {GPIO+3}
GPIO.setmode(GPIO.BCM)
for p in [IN1,IN2,IN3,IN4]: GPIO.setup(p, GPIO.OUT, initial=False)

seq = [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,1,0],
       [0,0,1,0],[0,0,1,1],[0,0,0,1],[1,0,0,1]]

def step(steps, delay=0.002):
    for _ in range(abs(steps)):
        for s in (seq if steps > 0 else reversed(seq)):
            for pin, val in zip([IN1,IN2,IN3,IN4], s):
                GPIO.output(pin, val)
            time.sleep(delay)

step(512)  # One full revolution
GPIO.cleanup()`,
      rpigpio: `import RPi.GPIO as GPIO
import time

IN1, IN2, IN3, IN4 = {GPIO}, {GPIO+1}, {GPIO+2}, {GPIO+3}
GPIO.setmode(GPIO.BCM)
for p in [IN1,IN2,IN3,IN4]: GPIO.setup(p, GPIO.OUT)

for _ in range(512):
    for s in [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]:
        for pin, val in zip([IN1,IN2,IN3,IN4], s):
            GPIO.output(pin, val)
        time.sleep(0.003)
GPIO.cleanup()`,
    },
    wiring: [
      { from: '5V', to: 'ULN2003 board VCC', color: '#ef4444' },
      { from: 'GND', to: 'ULN2003 board GND', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'ULN2003 IN1', color: '#ec4899' },
      { from: 'GPIO{GPIO+1}', to: 'ULN2003 IN2', color: '#f472b6' },
      { from: 'GPIO{GPIO+2}', to: 'ULN2003 IN3', color: '#f9a8d4' },
      { from: 'GPIO{GPIO+3}', to: 'ULN2003 IN4', color: '#fce7f3' },
    ],
  },
  // ── Input ──────────────────────────────────────────────────────────────────
  {
    id: 'button',
    name: 'Push Button',
    category: 'Input',
    icon: '🔘',
    power: '3.3V',
    current_ma: 0.1,
    pins: ['GPIO', 'GND'],
    recommended_gpio: [17, 22, 27, 5, 6, 13, 19, 26],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#8b5cf6',
    notes: 'Use internal pull-up (built into Pi). One leg to GPIO, other to GND.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import Button
from signal import pause

button = Button({GPIO})
button.when_pressed  = lambda: print("Pressed!")
button.when_released = lambda: print("Released")
pause()`,
      rpigpio: `import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.IN, pull_up_down=GPIO.PUD_UP)
try:
    while True:
        if GPIO.input({GPIO}) == GPIO.LOW:
            print("Button pressed!")
except KeyboardInterrupt:
    GPIO.cleanup()`,
    },
    wiring: [
      { from: 'GPIO{GPIO}', to: 'Button Pin 1', color: '#8b5cf6' },
      { from: 'GND', to: 'Button Pin 2', color: '#6b7280' },
    ],
  },
  {
    id: 'rotary',
    name: 'Rotary Encoder (KY-040)',
    category: 'Input',
    icon: '🎛️',
    power: '3.3V',
    current_ma: 1,
    pins: ['3.3V', 'GND', 'CLK', 'DT', 'SW'],
    recommended_gpio: [17, 18, 27, 22, 23],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#a855f7',
    notes: 'Uses 3 GPIO pins (CLK, DT, SW). Supports rotation direction + button press.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import RotaryEncoder, Button
from signal import pause

encoder = RotaryEncoder(a={GPIO}, b={GPIO+1}, max_steps=20)
button  = Button({GPIO+2})

encoder.when_rotated = lambda: print(f"Pos: {encoder.steps}")
button.when_pressed  = lambda: print("Clicked!")
pause()`,
      rpigpio: `import RPi.GPIO as GPIO

CLK, DT, SW = {GPIO}, {GPIO+1}, {GPIO+2}
GPIO.setmode(GPIO.BCM)
for pin in [CLK, DT, SW]:
    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

counter, last = 0, GPIO.input(CLK)
try:
    while True:
        clk = GPIO.input(CLK)
        if clk != last:
            counter += 1 if GPIO.input(DT) != clk else -1
            print(f"Counter: {counter}")
            last = clk
finally:
    GPIO.cleanup()`,
    },
    wiring: [
      { from: '3.3V', to: 'Encoder VCC', color: '#f97316' },
      { from: 'GND', to: 'Encoder GND', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'Encoder CLK', color: '#a855f7' },
      { from: 'GPIO{GPIO+1}', to: 'Encoder DT', color: '#c084fc' },
      { from: 'GPIO{GPIO+2}', to: 'Encoder SW', color: '#d8b4fe' },
    ],
  },
  {
    id: 'rfid',
    name: 'MFRC522 RFID Reader',
    category: 'Input',
    icon: '📶',
    power: '3.3V',
    current_ma: 13,
    pins: ['3.3V', 'GND', 'SDA', 'SCK', 'MOSI', 'MISO', 'RST'],
    recommended_gpio: ['SPI: GPIO8,11,10,9 + GPIO25(RST)'],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#14b8a6',
    spi: true,
    notes: 'Uses SPI (fixed pins). Enable SPI in raspi-config. RST uses any free GPIO.',
    library: 'mfrc522',
    code: {
      gpiozero: `from mfrc522 import SimpleMFRC522

reader = SimpleMFRC522()
print("Hold card to reader...")
try:
    uid, text = reader.read()
    print(f"UID: {uid}")
    print(f"Text: {text}")
finally:
    import RPi.GPIO as GPIO
    GPIO.cleanup()`,
      rpigpio: `from mfrc522 import SimpleMFRC522
import RPi.GPIO as GPIO

reader = SimpleMFRC522()
try:
    uid, data = reader.read()
    print(f"Card UID: {uid}")
finally:
    GPIO.cleanup()`,
    },
    wiring: [
      { from: '3.3V', to: 'RFID VCC (3.3V only!)', color: '#f97316' },
      { from: 'GND', to: 'RFID GND', color: '#6b7280' },
      { from: 'GPIO8 (CE0)', to: 'RFID SDA', color: '#14b8a6' },
      { from: 'GPIO11 (SCLK)', to: 'RFID SCK', color: '#2dd4bf' },
      { from: 'GPIO10 (MOSI)', to: 'RFID MOSI', color: '#5eead4' },
      { from: 'GPIO9 (MISO)', to: 'RFID MISO', color: '#99f6e4' },
      { from: 'GPIO25', to: 'RFID RST', color: '#a855f7' },
    ],
  },
  {
    id: 'potentiometer',
    name: 'Potentiometer + MCP3008 ADC',
    category: 'Input',
    icon: '🎚️',
    power: '3.3V',
    current_ma: 5,
    pins: ['3.3V', 'GND', 'WIPER→ADC', 'ADC via SPI'],
    recommended_gpio: ['SPI: GPIO8,9,10,11'],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#84cc16',
    spi: true,
    notes: 'Pi has no ADC — use MCP3008 SPI chip. Pot wiper → CH0 of MCP3008. Supports 8 analog channels.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import MCP3008
import time

pot = MCP3008(channel=0)  # Wiper on CH0
while True:
    value = pot.value  # 0.0 to 1.0
    print(f"Pot: {value:.2f}  ({int(value*100)}%)")
    time.sleep(0.1)`,
      rpigpio: `import spidev, time

spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 1350000

def read_channel(ch):
    r = spi.xfer2([1, (8 + ch) << 4, 0])
    return ((r[1] & 3) << 8) | r[2]

while True:
    raw = read_channel(0)
    print(f"ADC: {raw}  ({round(raw/1023*100)}%)")
    time.sleep(0.1)`,
    },
    wiring: [
      { from: '3.3V', to: 'MCP3008 VDD + VREF (pins 16, 15)', color: '#f97316' },
      { from: 'GND', to: 'MCP3008 DGND + AGND (pins 14, 9)', color: '#6b7280' },
      { from: 'GPIO8 (CE0)', to: 'MCP3008 CS (pin 10)', color: '#84cc16' },
      { from: 'GPIO11 (SCLK)', to: 'MCP3008 CLK (pin 13)', color: '#a3e635' },
      { from: 'GPIO10 (MOSI)', to: 'MCP3008 DIN (pin 11)', color: '#bef264' },
      { from: 'GPIO9 (MISO)', to: 'MCP3008 DOUT (pin 12)', color: '#d9f99d' },
      { from: '3.3V + GND', to: 'Pot outer legs · Wiper → MCP3008 CH0 (pin 1)', color: '#84cc16' },
    ],
  },
  {
    id: 'capacitive_touch',
    name: 'Capacitive Touch (TTP223)',
    category: 'Input',
    icon: '👆',
    power: '3.3V',
    current_ma: 3,
    pins: ['3.3V', 'GND', 'OUT'],
    recommended_gpio: [17, 22, 27, 5, 6, 13, 19, 26],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#f43f5e',
    notes: 'Momentary or toggle mode (solder jumper). HIGH when touched. No debounce needed. Works through thin glass/plastic.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import Button
from signal import pause

touch = Button({GPIO})
touch.when_pressed  = lambda: print("Touched!")
touch.when_released = lambda: print("Released")
pause()`,
      rpigpio: `import RPi.GPIO as GPIO
from signal import pause

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.IN)
GPIO.add_event_detect({GPIO}, GPIO.RISING,
    callback=lambda ch: print("Touch!"), bouncetime=200)
pause()`,
    },
    wiring: [
      { from: '3.3V', to: 'TTP223 VCC', color: '#f97316' },
      { from: 'GND', to: 'TTP223 GND', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'TTP223 OUT (I/O)', color: '#f43f5e' },
    ],
  },
  // ── Sensors ────────────────────────────────────────────────────────────────
  {
    id: 'dht22',
    name: 'DHT22 Temp/Humidity',
    category: 'Sensor',
    icon: '🌡️',
    power: '3.3V',
    current_ma: 2.5,
    pins: ['3.3V', 'GND', 'DATA'],
    recommended_gpio: [4, 17, 27],
    requires_resistor: { value: '10kΩ', placement: 'between 3.3V and Data (pull-up)' },
    requires_capacitor: null,
    color: '#3b82f6',
    notes: 'Needs 10kΩ pull-up resistor. Min 2 second polling interval.',
    library: 'adafruit_dht',
    code: {
      gpiozero: `import adafruit_dht
import board, time

dht = adafruit_dht.DHT22(board.D{GPIO})
while True:
    print(f"Temp: {dht.temperature:.1f}°C  Humidity: {dht.humidity:.1f}%")
    time.sleep(2)`,
      rpigpio: `import Adafruit_DHT, time

while True:
    hum, temp = Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, {GPIO})
    if hum and temp:
        print(f"Temp: {temp:.1f}°C  Humidity: {hum:.1f}%")
    time.sleep(2)`,
    },
    wiring: [
      { from: '3.3V', to: 'DHT22 VCC (Pin 1)', color: '#f97316' },
      { from: 'GND', to: 'DHT22 GND (Pin 4)', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'DHT22 DATA (Pin 2) + 10kΩ pull-up to 3.3V', color: '#3b82f6' },
    ],
  },
  {
    id: 'ultrasonic',
    name: 'HC-SR04 Ultrasonic',
    category: 'Sensor',
    icon: '📡',
    power: '5V',
    current_ma: 15,
    pins: ['5V', 'GND', 'TRIG', 'ECHO'],
    recommended_gpio: [23, 24, 5, 6, 13, 19],
    requires_resistor: { value: '1kΩ + 2kΩ voltage divider', placement: 'on ECHO pin (5V→3.3V)' },
    requires_capacitor: null,
    color: '#0ea5e9',
    notes: '⚠️ ECHO outputs 5V — MUST use 1kΩ+2kΩ voltage divider to protect 3.3V GPIO.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import DistanceSensor
import time

sensor = DistanceSensor(echo={GPIO+1}, trigger={GPIO})
while True:
    print(f"Distance: {sensor.distance * 100:.1f} cm")
    time.sleep(0.5)`,
      rpigpio: `import RPi.GPIO as GPIO, time

TRIG, ECHO = {GPIO}, {GPIO+1}
GPIO.setmode(GPIO.BCM)
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)

def get_distance():
    GPIO.output(TRIG, True); time.sleep(0.00001); GPIO.output(TRIG, False)
    while GPIO.input(ECHO) == 0: start = time.time()
    while GPIO.input(ECHO) == 1: end   = time.time()
    return ((end - start) * 34300) / 2

print(f"{get_distance():.1f} cm")`,
    },
    wiring: [
      { from: '5V', to: 'HC-SR04 VCC', color: '#ef4444' },
      { from: 'GND', to: 'HC-SR04 GND', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'HC-SR04 TRIG', color: '#0ea5e9' },
      { from: 'GPIO{GPIO+1}', to: 'HC-SR04 ECHO via 1kΩ+2kΩ divider', color: '#7dd3fc' },
    ],
  },
  {
    id: 'pir',
    name: 'PIR Motion Sensor (HC-SR501)',
    category: 'Sensor',
    icon: '👁️',
    power: '5V',
    current_ma: 65,
    pins: ['5V', 'GND', 'OUT'],
    recommended_gpio: [17, 22, 27, 4, 5, 6],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#f97316',
    notes: '5V powered, output is 3.3V compatible. Allow 30–60s warm-up. Onboard sensitivity + delay trimmers.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import MotionSensor

pir = MotionSensor({GPIO})
print("Warming up (30s)...")
pir.wait_for_no_motion()
print("Ready. Watching for motion...")
while True:
    pir.wait_for_motion()
    print("Motion detected!")
    pir.wait_for_no_motion()
    print("Motion stopped.")`,
      rpigpio: `import RPi.GPIO as GPIO, time

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.IN)
time.sleep(30)  # warmup
try:
    while True:
        if GPIO.input({GPIO}):
            print("Motion!")
            time.sleep(1)
finally:
    GPIO.cleanup()`,
    },
    wiring: [
      { from: '5V', to: 'PIR VCC (middle pin)', color: '#ef4444' },
      { from: 'GND', to: 'PIR GND (right pin)', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'PIR OUT (left pin)', color: '#f97316' },
    ],
  },
  {
    id: 'bmp280',
    name: 'BMP280 Barometric Pressure',
    category: 'Sensor',
    icon: '🌤️',
    power: '3.3V',
    current_ma: 3,
    pins: ['3.3V', 'GND', 'SDA', 'SCL'],
    recommended_gpio: ['SDA(GPIO2)', 'SCL(GPIO3)'],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#38bdf8',
    i2c: true,
    notes: 'I2C address 0x76 or 0x77 (SDO pin selects). Measures temp, pressure, altitude. Shareable I2C bus.',
    library: 'adafruit-circuitpython-bmp280',
    code: {
      gpiozero: `import board
import adafruit_bmp280, time

bmp = adafruit_bmp280.Adafruit_BMP280_I2C(board.I2C(), address=0x76)
bmp.sea_level_pressure = 1013.25

while True:
    print(f"Temp: {bmp.temperature:.1f}°C")
    print(f"Pressure: {bmp.pressure:.2f} hPa")
    print(f"Altitude: {bmp.altitude:.1f} m")
    time.sleep(2)`,
      rpigpio: `import smbus2, bmp280, time

bus = smbus2.SMBus(1)
sensor = bmp280.BMP280(i2c_dev=bus, i2c_addr=0x76)
while True:
    print(f"Temp: {sensor.get_temperature():.1f}°C  Pressure: {sensor.get_pressure():.1f}hPa")
    time.sleep(2)`,
    },
    wiring: [
      { from: '3.3V', to: 'BMP280 VCC', color: '#f97316' },
      { from: 'GND', to: 'BMP280 GND', color: '#6b7280' },
      { from: 'GPIO2 (SDA)', to: 'BMP280 SDA', color: '#38bdf8' },
      { from: 'GPIO3 (SCL)', to: 'BMP280 SCL', color: '#7dd3fc' },
    ],
  },
  {
    id: 'soilmoisture',
    name: 'Soil Moisture Sensor',
    category: 'Sensor',
    icon: '🌱',
    power: '3.3V',
    current_ma: 20,
    pins: ['3.3V', 'GND', 'DO'],
    recommended_gpio: [17, 22, 27, 4, 5, 6],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#65a30d',
    notes: 'Digital output only (wet/dry). For analog readings use MCP3008 ADC on AO pin. Adjust sensitivity trim pot.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import DigitalInputDevice
import time

sensor = DigitalInputDevice({GPIO}, pull_up=True)
while True:
    print("WET — no watering" if sensor.value == 0 else "DRY — water now!")
    time.sleep(2)`,
      rpigpio: `import RPi.GPIO as GPIO, time

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.IN)
while True:
    print("DRY" if GPIO.input({GPIO}) else "WET")
    time.sleep(2)`,
    },
    wiring: [
      { from: '3.3V', to: 'Sensor VCC', color: '#f97316' },
      { from: 'GND', to: 'Sensor GND', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'Sensor DO (Digital Out)', color: '#65a30d' },
    ],
  },
  {
    id: 'mq2',
    name: 'MQ-2 Gas / Smoke Sensor',
    category: 'Sensor',
    icon: '💨',
    power: '5V',
    current_ma: 150,
    pins: ['5V', 'GND', 'DO', 'AO'],
    recommended_gpio: [17, 22, 27, 4],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#a16207',
    notes: 'Detects LPG, smoke, alcohol, propane. 5V power, digital output is 3.3V safe. 20s preheat required.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import DigitalInputDevice
import time

gas = DigitalInputDevice({GPIO})
print("Preheating (20s)...")
time.sleep(20)
print("Monitoring...")
while True:
    print("⚠️ GAS DETECTED!" if gas.value == 0 else "Air clear")
    time.sleep(1)`,
      rpigpio: `import RPi.GPIO as GPIO, time

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.IN)
time.sleep(20)
while True:
    if GPIO.input({GPIO}) == 0: print("GAS!")
    time.sleep(0.5)`,
    },
    wiring: [
      { from: '5V', to: 'MQ-2 VCC', color: '#ef4444' },
      { from: 'GND', to: 'MQ-2 GND', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'MQ-2 DO (Digital Out)', color: '#a16207' },
    ],
  },
  {
    id: 'ldr',
    name: 'LDR Light Sensor',
    category: 'Sensor',
    icon: '☀️',
    power: '3.3V',
    current_ma: 1,
    pins: ['3.3V', 'GND', 'GPIO'],
    recommended_gpio: [17, 22, 27, 4, 5, 24, 25],
    requires_resistor: null,
    requires_capacitor: { value: '1µF', placement: 'between GPIO pin and GND (RC timing)' },
    color: '#fde047',
    notes: 'RC charge-time trick — no ADC needed. Brighter = faster discharge = lower reading.',
    library: 'gpiozero',
    code: {
      gpiozero: `from gpiozero import LightSensor
import time

ldr = LightSensor({GPIO})
while True:
    v = ldr.value
    print(f"Light: {v:.2f}  ({'Bright' if v > 0.5 else 'Dark'})")
    time.sleep(0.5)`,
      rpigpio: `import RPi.GPIO as GPIO, time

PIN = {GPIO}
def read_ldr():
    count = 0
    GPIO.setup(PIN, GPIO.OUT); GPIO.output(PIN, GPIO.LOW); time.sleep(0.1)
    GPIO.setup(PIN, GPIO.IN)
    while GPIO.input(PIN) == GPIO.LOW:
        count += 1
        if count > 10000: break
    return count

GPIO.setmode(GPIO.BCM)
while True:
    print(f"LDR: {read_ldr()}")
    time.sleep(0.5)`,
    },
    wiring: [
      { from: '3.3V', to: 'LDR one leg', color: '#fde047' },
      { from: 'GPIO{GPIO}', to: 'LDR other leg + 1µF capacitor to GND', color: '#fef08a' },
      { from: 'GND', to: 'Capacitor negative', color: '#6b7280' },
    ],
  },
  {
    id: 'irrecv',
    name: 'IR Receiver (VS1838B)',
    category: 'Sensor',
    icon: '🔴',
    power: '3.3V',
    current_ma: 1,
    pins: ['3.3V', 'GND', 'OUT'],
    recommended_gpio: [17, 22, 27, 4],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#7c3aed',
    notes: '38kHz carrier. Works with most TV remotes. Use lirc or ir-keytable for full remote mapping.',
    library: 'ir-keytable',
    code: {
      gpiozero: `# Install: sudo apt install lirc
# Enable: sudo ir-keytable -t -s rc0
# Python via evdev:
import evdev

device = evdev.InputDevice('/dev/input/event0')
for event in device.read_loop():
    if event.type == evdev.ecodes.EV_KEY:
        print(f"Key code: {event.code}")`,
      rpigpio: `import RPi.GPIO as GPIO, time

GPIO.setmode(GPIO.BCM)
GPIO.setup({GPIO}, GPIO.IN)
print("Waiting for IR signal...")
try:
    while True:
        if GPIO.input({GPIO}) == 0:
            print("IR pulse detected")
            time.sleep(0.1)
finally:
    GPIO.cleanup()`,
    },
    wiring: [
      { from: '3.3V', to: 'IR Receiver VCC (pin 3)', color: '#f97316' },
      { from: 'GND', to: 'IR Receiver GND (pin 2)', color: '#6b7280' },
      { from: 'GPIO{GPIO}', to: 'IR Receiver OUT (pin 1)', color: '#7c3aed' },
    ],
  },
  {
    id: 'gps',
    name: 'GPS Module (NEO-6M)',
    category: 'Sensor',
    icon: '🛰️',
    power: '3.3V',
    current_ma: 45,
    pins: ['3.3V', 'GND', 'TX→Pi RX', 'RX←Pi TX'],
    recommended_gpio: ['UART: GPIO15(RX), GPIO14(TX)'],
    requires_resistor: null,
    requires_capacitor: null,
    color: '#0891b2',
    notes: 'UART (GPIO14/15). Disable Pi serial console first: raspi-config → Interface → Serial. Needs clear sky for fix.',
    library: 'pynmea2',
    code: {
      gpiozero: `import serial, pynmea2

ser = serial.Serial('/dev/serial0', 9600, timeout=1)
print("Waiting for GPS fix...")
while True:
    line = ser.readline().decode('ascii', errors='replace')
    if line.startswith('$GPRMC') or line.startswith('$GNRMC'):
        try:
            msg = pynmea2.parse(line)
            if msg.status == 'A':
                print(f"Lat: {msg.latitude:.6f}, Lon: {msg.longitude:.6f}")
        except: pass`,
      rpigpio: `import serial, pynmea2

ser = serial.Serial('/dev/serial0', baudrate=9600, timeout=0.5)
while True:
    data = ser.readline().decode('ascii', errors='replace')
    if '$GPGGA' in data:
        try:
            msg = pynmea2.parse(data)
            print(f"Lat: {msg.latitude}, Lon: {msg.longitude}")
        except: pass`,
    },
    wiring: [
      { from: '3.3V', to: 'GPS VCC', color: '#f97316' },
      { from: 'GND', to: 'GPS GND', color: '#6b7280' },
      { from: 'GPIO15 (RX)', to: 'GPS TX', color: '#0891b2' },
      { from: 'GPIO14 (TX)', to: 'GPS RX', color: '#06b6d4' },
    ],
  },
];

export const PI_MODELS = [
  { id: 'pi5',    name: 'Raspberry Pi 5',   ram: '4GB–8GB', gpio: 40, usb3: true,  gbe: true,  maxCurrent: 5000, icon: '🍓' },
  { id: 'pi4',    name: 'Raspberry Pi 4',   ram: '2GB–8GB', gpio: 40, usb3: true,  gbe: true,  maxCurrent: 3000, icon: '🍓' },
  { id: 'pi3b',   name: 'Raspberry Pi 3B+', ram: '1GB',     gpio: 40, usb3: false, gbe: false, maxCurrent: 2500, icon: '🍓' },
  { id: 'pizero2',name: 'Pi Zero 2W',        ram: '512MB',   gpio: 40, usb3: false, gbe: false, maxCurrent: 1200, icon: '🍓' },
];

export const GPIO_PINS = [
  { pin: 1,  bcm: -1, label: '3.3V',           type: 'power'   },
  { pin: 2,  bcm: -1, label: '5V',             type: 'power'   },
  { pin: 3,  bcm: 2,  label: 'GPIO2 (SDA)',    type: 'i2c'     },
  { pin: 4,  bcm: -1, label: '5V',             type: 'power'   },
  { pin: 5,  bcm: 3,  label: 'GPIO3 (SCL)',    type: 'i2c'     },
  { pin: 6,  bcm: -1, label: 'GND',            type: 'gnd'     },
  { pin: 7,  bcm: 4,  label: 'GPIO4',          type: 'gpio'    },
  { pin: 8,  bcm: 14, label: 'GPIO14 (TX)',    type: 'uart'    },
  { pin: 9,  bcm: -1, label: 'GND',            type: 'gnd'     },
  { pin: 10, bcm: 15, label: 'GPIO15 (RX)',    type: 'uart'    },
  { pin: 11, bcm: 17, label: 'GPIO17',         type: 'gpio'    },
  { pin: 12, bcm: 18, label: 'GPIO18 (PWM)',   type: 'pwm'     },
  { pin: 13, bcm: 27, label: 'GPIO27',         type: 'gpio'    },
  { pin: 14, bcm: -1, label: 'GND',            type: 'gnd'     },
  { pin: 15, bcm: 22, label: 'GPIO22',         type: 'gpio'    },
  { pin: 16, bcm: 23, label: 'GPIO23',         type: 'gpio'    },
  { pin: 17, bcm: -1, label: '3.3V',           type: 'power'   },
  { pin: 18, bcm: 24, label: 'GPIO24',         type: 'gpio'    },
  { pin: 19, bcm: 10, label: 'GPIO10 (MOSI)',  type: 'spi'     },
  { pin: 20, bcm: -1, label: 'GND',            type: 'gnd'     },
  { pin: 21, bcm: 9,  label: 'GPIO9 (MISO)',   type: 'spi'     },
  { pin: 22, bcm: 25, label: 'GPIO25',         type: 'gpio'    },
  { pin: 23, bcm: 11, label: 'GPIO11 (SCLK)',  type: 'spi'     },
  { pin: 24, bcm: 8,  label: 'GPIO8 (CE0)',    type: 'spi'     },
  { pin: 25, bcm: -1, label: 'GND',            type: 'gnd'     },
  { pin: 26, bcm: 7,  label: 'GPIO7 (CE1)',    type: 'spi'     },
  { pin: 27, bcm: -1, label: 'ID_SD',          type: 'special' },
  { pin: 28, bcm: -1, label: 'ID_SC',          type: 'special' },
  { pin: 29, bcm: 5,  label: 'GPIO5',          type: 'gpio'    },
  { pin: 30, bcm: -1, label: 'GND',            type: 'gnd'     },
  { pin: 31, bcm: 6,  label: 'GPIO6',          type: 'gpio'    },
  { pin: 32, bcm: 12, label: 'GPIO12 (PWM)',   type: 'pwm'     },
  { pin: 33, bcm: 13, label: 'GPIO13 (PWM)',   type: 'pwm'     },
  { pin: 34, bcm: -1, label: 'GND',            type: 'gnd'     },
  { pin: 35, bcm: 19, label: 'GPIO19 (PWM)',   type: 'pwm'     },
  { pin: 36, bcm: 16, label: 'GPIO16',         type: 'gpio'    },
  { pin: 37, bcm: 26, label: 'GPIO26',         type: 'gpio'    },
  { pin: 38, bcm: 20, label: 'GPIO20',         type: 'gpio'    },
  { pin: 39, bcm: -1, label: 'GND',            type: 'gnd'     },
  { pin: 40, bcm: 21, label: 'GPIO21',         type: 'gpio'    },
];

export const AVAILABLE_GPIOS = GPIO_PINS.filter(p => p.bcm > 0).map(p => p.bcm);

export const AI_EXAMPLES = [
  'I want to build an LED volume knob',
  'Build a room temperature monitor with display',
  'Create a door alarm with motion sensor and buzzer',
  'Make a servo controller with a button',
  'Build an RFID access control system',
  'Distance sensor that beeps when something gets close',
  'SDR setup with Pluto+ for signal monitoring',
  'Smart plant watering monitor',
];
