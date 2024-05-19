import {Subprocess} from "bun"
import config from "./config.json" assert {type: "json"}

const master = async (): Promise<Subprocess[]> => {
    let procs: Subprocess[] = []

    const init = async () => {
        for (let i = 0; i < config.WORKER_COUNT; i++) {
            procs.push(spawn())
            await Bun.sleep(config.POLLING_WORKER_POLL_MS / config.WORKER_COUNT)
            console.log(`Spawning worker ${i}`)
        }
    }

    const spawn = (): Subprocess => {
        console.info(`Spawning polling_worker`)
        return Bun.spawn(["bun", "polling_worker.ts"], {
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
    }

    init()
    return procs
}

let procs: Subprocess[] = await master()

/*
setTimeout(() => {
    proc.send("Parent to child messsage")
}, 2000)
*/
process.on("SIGINT", async () => {
    console.log("Ctrl-C was pressed")

    let killPromises = []
    for (const proc of procs) {
        killPromises.push(proc.exited)
        proc.kill()
    }

    await Promise.all(killPromises)
    console.log(`All polling_worker killed`)

    process.exit()
})
