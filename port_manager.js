class PortManager {
    constructor() {
        this.connected = false;
        this.port = null;

        this.connectedListener = null;

        this.streamListener = null;

        this.loopRunning = false;
    }

    async requestOpen() {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        
        port.addEventListener('disconnect', () => {
            this.connected = false;
            this.port = null;

            if(this.connectedListener) {
                this.connectedListener(false);
            }
        });

        this.connected = true;
        this.port = port;

        if(this.connectedListener) {
            this.connectedListener(true);
        }

        this.runLoop();
    }

    async runLoop() {
        if(this.loopRunning) {
            return;
        }

        this.loopRunning = true;

        for await (const chunk of streamAsyncIterator(this.port.readable)) {
            if(this.streamListener) {
                this.streamListener(chunk);
            }
        }

        this.loopRunning = false;
    }
}