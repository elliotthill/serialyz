const proc = Bun.spawn(["bun", "polling_worker.ts"], {
    cwd: "./", // specify a working directory
    env: {...process.env, FOO: "bar"}, // specify environment variables
    onExit(proc, exitCode, signalCode, error) {
        // exit handler
        //
        console.log("Process exited")
    },
    ipc(message) {
        console.log(`Parent received: ${message} from child`)
        /**
         * The message received from the sub process
         **/
    },
    stdio: ["inherit", "inherit", "inherit"],
    serialization: "json"
})

setTimeout(() => {
    proc.send("Parent to child messsage")
}, 2000)
process.on("SIGINT", () => {
    console.log("Ctrl-C was pressed")
    proc.kill()
    process.exit()
})
