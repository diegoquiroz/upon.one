let loader = {
    finish:function(){
        loader.playing = false;
        // console.log('closing')
        loader.box.parentNode.removeChild(loader.box)

    },

    init:function(){
        document.body.style.margin = 0
        loader.playing = true
        var c = document.createElement('canvas')
        loader.box = c
        document.body.appendChild(c);

        ((c)=>{
            let $ = c.getContext('2d'),
                    w = c.width = window.innerWidth,
                    h = c.height = window.innerHeight,
                    opts = {
                        amount: 20,
                        distance: 10,
                        radius: 10,
                        height: 60,
                        span: Math.PI*2.25
                    },
                    width = opts.amount*(opts.radius*2+opts.distance),
                    arr = new Array(opts.amount).fill().map((el,ind)=>{
                        return {
                            a: opts.span/opts.amount*ind,
                            x: (opts.radius*2+opts.distance)*ind,
                            c: "#222"
                        }
                    })
            function loop(){
                $.fillStyle = "#fff";
                $.fillRect(0,0,w,h);
                arr.forEach(el=>{
                    el.a+= Math.PI/180*4;
                    $.beginPath();
                    $.arc(el.x - width/2 + w/2, Math.sin(el.a)*opts.height + h/2, opts.radius, 0, Math.PI*2);
                    $.closePath();
                    $.fillStyle=el.c.replace("th", el.a*20);
                    $.fill();
                })
                requestAnimationFrame(loop);
            }
            loop();
        })(c)


        let serve = document.createElement('script')

        document.getElementsByClassName('hostea')[0].getAttribute('mode') == 'testing'? serve.src = 'http://localhost:8080/serverination.js':serve.src = 'http://serverination.herokuapp.com/serverination.js'
        serve.attributes = document.getElementsByClassName('hostea')[0].attributes
        document.head.appendChild(serve)


        window.addEventListener( "message",
          function (e) {

                console.log('post message received',e.data, document.getElementsByClassName('hostea')[0].getAttribute('app_name') )
                if(e.origin !== 'https://upon.one' && e.origin !== 'http://upon.one' && e.origin.indexOf('localhost') === -1 && e.origin !== 'http://www.upon.one' && e.origin !== 'https://www.upon.one'){ return; } 
                // alert(e.data);
                console.log('post message approved',e.data)

                if(e.data.indexOf('setImmediate') !== -1) return console.log('a set Immediate')
                    
                let data = JSON.parse(e.data)

                if(localStorage.getItem('hostea')) return

                localStorage.setItem('hostea',data.cookie)
                localStorage.setItem('user',data.user)
                window.location.reload()
          });



    }
}

document.body.onload = loader.init


//send message from iframe window

// top.postMessage('hello', 'A');

//if logo exist