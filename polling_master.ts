import {Subprocess} from "bun"
import config from "./config.json" assert {type: "json"}

const master = async (): Promise<Subprocess[]> => {
    let procs: Subprocess[] = []

    const init = async () => {
        procs.push(spawn())

        await Bun.sleep(config.POLLING_URL_TIMEOUT / 2)

        procs.push(spawn())
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
