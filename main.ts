/*
Copyright (C): 2020, Shenzhen Yahboom Tech
modified by zzx
Write the date: 2020-9-15
*/

const enum RemoteButton {
	Power = 0x0,
	Up = 0x1,
	Left = 0x4,
	Right = 0x6,
	Down = 0x9,
	Light = 0x2,
	BEEP = 0x5,
	Plus = 0xc,
	Minus = 0xe,
	TLeft = 0x8,
	TRight = 0xA,
	NUM0 = 0xD,
	NUM1 = 0x10,
	NUM2 = 0x11,
	NUM3 = 0x12,
	NUM4 = 0x14,
	NUM5 = 0x15,
	NUM6 = 0x16,
	NUM7 = 0x18,
	NUM8 = 0x19,
	NUM9 = 0x1A
}
/**
	IR remote
 */
//% icon="\uf1eb" weight=19 color=50
namespace irReceiver {
    /**
     * define a IR receiver class
     */
    class irReceiver {
        constructor() {
            this.address = 0;
            this.command = 0;
        }
        address: number;
        command: number;
        IR_pin: DigitalPin;
    }
    //create a IR receiver class
    let IR_R = new irReceiver;

    //define nec_IR maximum number of pulses is 33.
    //create 2 pulse cache array.
    let maxPulse: number = 33;
    let low_pulse: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let high_pulse: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    //must define for 33,
    //otherwise there is a risk of error in receiving the first data.
    let LpulseCounter: number = 33;
    let HpulseCounter: number = 33;

    let LpulseTime: number = 0;
    let HpulseTime: number = 0;
    //let pulse9ms: boolean = false;
    //let pulse4ms: boolean = false;
    //This variable will become true when the pulse is repeated
    //let repeatedPulse: boolean = false;

    /**
     * initialize the IR receiver function
     */
    function irInit(IR_pin: DigitalPin) {
        pins.onPulsed(IR_pin, PulseValue.Low, () => {      //interrupt event
            LpulseTime = pins.pulseDuration();             //measure the pulse
            if (8250 < LpulseTime && LpulseTime < 9250) {  //9ms
                LpulseCounter = 0;
            }
            if (LpulseCounter < maxPulse /*&& repeatedPulse == false*/) {
                low_pulse[LpulseCounter] = LpulseTime;
                LpulseCounter += 1;
            }
        });
        pins.onPulsed(IR_pin, PulseValue.High, () => {
            HpulseTime = pins.pulseDuration();
            /*if (2000 < HpulseTime && HpulseTime < 2500) {  //2.25ms
                repeatedPulse = true;
            }*/
            if (4250 < HpulseTime && HpulseTime < 4750) {  //4.5ms
                HpulseCounter = 0;
                //repeatedPulse = false;
            }
            if (HpulseCounter < maxPulse /*&& repeatedPulse == false*/) {
                high_pulse[HpulseCounter] = HpulseTime;
                HpulseCounter += 1;
            }
        });
    }
    /**
	IR data process
    */
    function irDataProcessing() {
        let tempAddress: number = 0;
        let inverseAddress: number = 0;
        let tempCommand: number = 0;
        let inverseCommand: number = 0;
        let num: number;
        //confirm start pulse
        if (8250 < low_pulse[0] && low_pulse[0] < 9250 && HpulseCounter >= 33) {
            //conver the pulse into data
            for (num = 1; num < maxPulse; num++) {
                //if (440 < low_pulse[num] && low_pulse[num] < 680) {      //0.56ms
                if (1400 < high_pulse[num] && high_pulse[num] < 2000) {  //1.69ms = 1, 0.56ms = 0
                    if (1 <= num && num < 9) {    //conver the pulse into address
                        tempAddress |= 1 << (num - 1);
                    }
                    if (9 <= num && num < 17) {   //conver the pulse into inverse address
                        inverseAddress |= 1 << (num - 9);
                    }
                    if (17 <= num && num < 25) {   //conver the pulse into command
                        tempCommand |= 1 << (num - 17);
                    }
                    if (25 <= num && num < 33) {   //conver the pulse into inverse command
                        inverseCommand |= 1 << (num - 25);
                    }
                }
                //}
            }
            low_pulse[0] = 0;
            //check the data and return the data to IR receiver class.
            if ((tempAddress + inverseAddress == 0xff) && (tempCommand + inverseCommand == 0xff)) {
                IR_R.address = tempAddress;
                IR_R.command = tempCommand;
                return;
            } else {  //Return -1 if check error.
                IR_R.address = -1;
                IR_R.command = -1;
                return;
            }
        }
        IR_R.address = 0;
        IR_R.command = 0;
    }
	/*
    * initialization
    */
    //% blockId=Mbit_IR_init
    //% blockGap=20 weight=90
    //% block="connect ir receiver to %pin"
    //% shim=Mbit_IR::init
    export function init(IR_pin: DigitalPin): void {
        IR_R.IR_pin = IR_pin;   //define IR receiver control pin
        pins.setPull(IR_R.IR_pin, PinPullMode.PullUp);
        irInit(IR_R.IR_pin);   //initialize the IR receiver
    }
    /*
    //% blockId=Mbit_IR_received_event
    //% blockGap=20 weight=89
    //% block="on |%btn| button pressed"
    //% shim=Mbit_IR::onPressEvent
    export function onPressEvent(btn: RemoteButton, body:Action): void {
      return
    }
    //% subcategory="IR Remote"
    //% blockId=infrared_button
    //% button.fieldEditor="gridpicker"
    //% button.fieldOptions.columns=3
    //% button.fieldOptions.tooltips="false"
    //% block="IR button %button"
    //% weight=98
    export function irButton(button: IrButton): number {
        return button as number;
    }
	*/


