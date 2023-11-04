const colyseus = require('colyseus.js');

const client = new colyseus.Client('ws://localhost:2567');

async function f()
{
    room = await client.joinOrCreate('Belote')
    room.state.onChange(() => {
        // This function will be called when the room state changes
        // Update your client-side UI or perform any logic here based on the new state
        console.log('New room state:', room.state);
        console.log(room.state.North.id);
    });

}

f()



