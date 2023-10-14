

class DelayedPromise {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
        // Store the resolve function for later use
        this.resolveFunction = resolve;
        });
    }

    // Function to resolve the promise externally
    resolve(data) {
        this.resolveFunction(data);
    }

    // Function to handle the resolved promise
    async then(callback) {
        return this.promise.then(callback);
    }

    // Function to handle errors if needed
    catch(callback) {
        return this.promise.catch(callback);
    }
}

class CompressDataHandler {
    constructor() {

        const cs = new CompressionStream("gzip");
        this.writer = cs.writable.getWriter();
        this.reader = cs.readable.getReader();

        this.buffer = [];
        this.processing = false;

        this.doneWriting = false;

        this.donePromise = new DelayedPromise();

        this.first = false;
    }

    addToBuffer(data) {

        if(this.doneWriting) {
            return;
        }

        this.buffer.push(data);
        this.processCurrentBuffer();
    }

    async processCurrentBuffer() {
        
        if(this.processing) {
            return;
        }

        if(this.first) {
            await this.writer.ready;
            this.first = false;
        }

        this.processing = true;

        while(this.buffer.length > 0) {
            const data = this.buffer.shift();
            this.writer.write(data);
        }

        this.processing = false;

        if(this.doneWriting) {
            this.writer.close();
            this.donePromise.resolve();
        }
    }

    async getCompressedData() {
        this.doneWriting = true;
        await this.processCurrentBuffer();
        await this.donePromise;

        //save the compressed data
        let output = [];
        let totalSize = 0;
        while (true) {
            const { value, done } = await this.reader.read();
            if (done) break;
            output.push(value);
            totalSize += value.byteLength;
        }
        const concatenated = new Uint8Array(totalSize);
        let offset = 0;
        //finally build the compressed array and return it 
        for (const array of output) {
            concatenated.set(array, offset);
            offset += array.byteLength;
        }
        return concatenated;
        
    }

}