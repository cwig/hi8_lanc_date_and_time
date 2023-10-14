class RecordingMananger {
    constructor(stream) {
        this.currentRecording = null;
        this.recording = false;

        this.gotRecordingListener = null;

        this.stream = stream;
        this.totalBytes = 0;
    }

    async gotData(data) {
        if(this.recording) {
            this.currentRecording.addToBuffer(data);
            this.totalBytes += data.length;
        }
    }

    async startRecording() {
        this.currentRecording = new CompressDataHandler();
        this.recording = true;
        this.totalBytes = 0;
    }

    async stopRecording() {
        this.recording = false;
        // return await this.currentRecording.getCompressedData();
        if(this.gotRecordingListener) {
            this.gotRecordingListener(await this.currentRecording.getCompressedData());
        }

        this.currentRecording = null;
    }

    async toggleRecording() {
        if(this.recording) {
            return await this.stopRecording();
        }
        else {
            await this.startRecording();
        }
    }
}