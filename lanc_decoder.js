class LancDecoder {
    constructor() {

        this.reset();

        this.dataCodeListener = null;
        this.rtDataListener = null;
        this.reachedEndListener = null;
    }

    reset() {
        this.buffer = [];

        this.state = {};

        this.dataCodeState = {
            'year': -1,
            'month': -1,
            'day': -1,
            'hour': -1,
            'minute': -1,
            // 'second': -1,
            'yearChanged': true,
            'monthChanged': true,
            'dayChanged': true,
            'hourChanged': true,
            'minuteChanged': true,
            // 'secondChanged': true,
        };

        this.rtData = {
            'hours': null,
            'minutes': null,
            'seconds': null,
            'sign': null,
        }

        this.safeDate = null;

        this.onDate = false;
        this.onTime = false;
    }

    refreshDataCode() {

        let changeOccurred = false;
        for(let key in this.dataCodeState) {
            if(this.dataCodeState[key] && key.includes("Changed")) {
                changeOccurred = true;
                break;
            }
        }

        if(changeOccurred) {
            return;
        }

        this.safeDate = new Date(this.dataCodeState['year'] + 2000, this.dataCodeState['month'] - 1, this.dataCodeState['day'], this.dataCodeState['hour'], this.dataCodeState['minute'], 0);
        
        if(this.dataCodeListener) {
            this.dataCodeListener(this.safeDate);
        }
        
        return this.safeDate;
    }

    refreshRTData() {
        if(this.rtData['hours'] == null || this.rtData['minutes'] == null || this.rtData['seconds'] == null || this.rtData['sign'] == null) {
            return;
        }

        let sign = this.rtData['sign'];
        let hours = this.rtData['hours'];
        let minutes = this.rtData['minutes'];
        let seconds = this.rtData['seconds'];

        this.rt = sign * (hours * 3600 + minutes * 60 + seconds);

        if(this.rtDataListener) {
            this.rtDataListener(this.rt);
        }

        return this.rt;
    }

    updateDataCodeYearMonth(year, month) {
        if(this.dataCodeState['year'] != year) {
            this.dataCodeState['year'] = year;
            this.dataCodeState['yearChanged'] = true;
        }
        else {
            this.dataCodeState['yearChanged'] = false;
        }

        if(this.dataCodeState['month'] != month) {
            this.dataCodeState['month'] = month;
            this.dataCodeState['monthChanged'] = true;
        }
        else {
            this.dataCodeState['monthChanged'] = false;
        }

        this.refreshDataCode();
    }

    updateDataCodeDay(day) {
        if(this.dataCodeState['day'] != day) {
            this.dataCodeState['day'] = day;
            this.dataCodeState['dayChanged'] = true;
        }
        else {
            this.dataCodeState['dayChanged'] = false;
        }

        this.refreshDataCode();
    }

    updateDataCodeHourMinute(hour, minute) {
        if(this.dataCodeState['hour'] != hour) {
            this.dataCodeState['hour'] = hour;
            this.dataCodeState['hourChanged'] = true;
        }
        else {
            this.dataCodeState['hourChanged'] = false;
        }

        if(this.dataCodeState['minute'] != minute) {
            this.dataCodeState['minute'] = minute;
            this.dataCodeState['minuteChanged'] = true;
        }
        else {
            this.dataCodeState['minuteChanged'] = false;
        }

        this.refreshDataCode();
    }

    updateDataCodeSecond(second) {

        if(this.dataCodeState['second'] != second) {
            this.dataCodeState['second'] = second;
            this.dataCodeState['secondChanged'] = true;
        }
        else {
            this.dataCodeState['secondChanged'] = false;
        }

        this.refreshDataCode();
    }

    updateRTSecMin(sec, min) {
        this.rtData['seconds'] = sec;
        this.rtData['minutes'] = min;

        this.refreshRTData();
    }

    updateRTHourSign(hour, sign) {
        this.rtData['hours'] = hour;
        this.rtData['sign'] = sign;

        this.refreshRTData();
    }

    parse(data) {
        for(const v of data) {
            if(v == 0x0A) {
                this.process(this.buffer);
                this.buffer = [];
            }
            else {
                this.buffer.push(v);
            }
        }
    }

    process(data) {
        if(data.length != 8) {
            return;
        }

        
        const all255 = data.reduce((acc, val) => acc && val == 255, true);
        if(all255) {
            console.log("Device is Off");
            this.onDate = false;
            this.onTime = false;
            return;
        }

        const mode = data[4];

        if(mode == 0x62) {

            if(this.reachedEndListener) {
                this.reachedEndListener();
            }
            //end of tape
            return;
        }

        const guideCode = (data[5] & 0xF0) >> 4;

        if(guideCode == 0x1) {
            // let tapeSpeed = "SP";
            // if(data[6] & 0b00000011) {
            //     tapeSpeed = "LP";
            // }
            // this.state['tapeSpeed'] = tapeSpeed;

            // this.state['FM-sound'] = data[6] & 0b00000100 ? 1 : 0;
            // this.state['PCM-sound'] = data[6] & 0b00001000 ? 1 : 0;

            // const camera_mode = data[6] & 0b00010000;
            // const rec_prot = data[6] & 0b00100000;
            // const ME = data[6] & 0b01000000;
            // const size = data[6] & 0b10000000;

            // this.state['camera_mode'] = camera_mode;
            // this.state['rec_prot'] = rec_prot;
            // this.state['ME'] = ME;
            // this.state['size'] = size;

            // const camera_mode = data[7] & 0b00000010;
            // const servo = data[7] & 0b00001000;

            // this.state['camera_mode'] = camera_mode;
            // this.state['servo'] = servo;

            // console.log(JSON.stringify(this.state));

            // const input_sel = data[7] & 0b00110000;
            // this.state['input_sel'] = input_sel;
            // console.log(JSON.stringify(this.state));
        }

        if(guideCode == 0x3) {
            let seconds = data[6] & 0b00001111;
            let ten_seconds = (data[6] & 0b11110000) >> 4;
            let minutes = data[7] & 0b00001111;
            let ten_minutes = (data[7] & 0b11110000) >> 4;

            this.updateRTSecMin(ten_seconds * 10 + seconds, ten_minutes * 10 + minutes);
        }

        if(guideCode == 0x4) {
            let hours = data[6] & 0b00001111;
            let ten_hours = (data[6] & 0b11110000) >> 4;
            let sign = data[7] & 0b10000000 ? -1 : 1;

            this.updateRTHourSign(ten_hours * 10 + hours, sign);
        }

        if(guideCode == 0x8) {
            this.onDate = data[7] == 3;
            this.onTime = data[7] == 4;
        }

        if(guideCode == 0x9) {
            
            if(this.onDate) {
                let year_ones = data[6] & 0b00001111;
                let year_tens = (data[6] & 0b11110000) >> 4;
                let month_ones = data[7] & 0b00001111;
                let month_tens = (data[7] & 0b11110000) >> 4;
                this.updateDataCodeYearMonth(year_tens * 10 + year_ones, month_tens * 10 + month_ones);
            }
            if(this.onTime) {
                let hour_ones = data[6] & 0b00001111;
                let hour_tens = (data[6] & 0b11110000) >> 4;
                let minute_ones = data[7] & 0b00001111;
                let minute_tens = (data[7] & 0b11110000) >> 4;
                this.updateDataCodeHourMinute(hour_tens * 10 + hour_ones, minute_tens * 10 + minute_ones);
            }
        }

        if(guideCode == 0xA) {
            if(this.onDate) {
                let day_ones = data[6] & 0b00001111;
                let day_tens = (data[6] & 0b11110000) >> 4;
                this.updateDataCodeDay(day_tens * 10 + day_ones);
            }
            // if(this.onTime) {
            //     let second_ones = data[6] & 0b00001111;
            //     let second_tens = (data[6] & 0b11110000) >> 4;
            //     this.updateDataCodeSecond(second_tens * 10 + second_ones);
            // }
        }

    }
}