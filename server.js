const mongo = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000).sockets;

//  Connect to MongoDB
mongo.connect('mongodb://127.0.0.1:27017/mongochat', function(err, client){
  if(err) {
    throw err;
  }
  console.log('MongoDB connected...');

  //  Connect to socket.io
  io.on('connection', function(socket){
    "use strict"
    let chat = client.db('mongochat').collection('chats');

    //  Create function to send status
    let sendStatus = function(s) {
      socket.emit('status',s);
    }

    //  Get chats from mongo collection
    chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
        if(err){
            throw err;
        }

        // Emit the messages
        socket.emit('output', res);
    });

    //  Handle input events
    socket.on('input', function(data) {
      let name = data.name;
      let message = data.message;

      //  Check for name and messages
      if(name == '' || message == '') {
        //  Send error status
        sendStatus('Please enter a name and message');
      } else {
        //  Insert message
        chat.insert({name: name, message: message}, function(){
          io.emit('output', [data]);

          //  Send status object
          sendStatus({
            message: 'Message sent',
            clear: true
          });
        });
      }
    });

    //  Handle clear
    socket.on('clear', function(data){
      //  Remove all chats from the collection
      chat.remove({}, function() {
        //   Emit cleared
        socket.emit('cleared');
      });
    });
  });
});
