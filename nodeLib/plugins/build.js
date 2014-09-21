var _path = require('path'), 
    fs = require('fs'), 
    http = require('http'), 
    exec = require('child_process').exec; 
var pathMap = function(path){
    if( path.match(/(.+?\.)(css|js)$/) && !path.match(/(\bmin\.)(css|js)$/) ){
        return path.replace(/(.+?\.)(css|js)$/,'$1min.$2');
    }else{
        return path
    }
};    
exports.execute = function(req,resp,root,handle,mini,conf){ 
    var _root = conf.output, mime = req.util.mime, 
        host = "http://"+req.headers.host.split(":")[0]+":"+conf.port+"/";
    
    var build = function( path ){ 
        var extType = _path.extname(path).substring(1); 
        fs.stat(root+path,function(error,stats){ 
            if(stats && stats.isFile && stats.isFile() && mime.isTXT(extType)){ 
                var info = "";
                http.get(host+path, function(res) { 
                    var type = res.headers['middleware-type']; 
                    res.on('data',function(data){ 
                       info += data; 
                    }); 
                    res.on('end',function(data){ 
                        if(type){ 
                            path = path.replace(/[^\.]+$/,type);     //对应 middleware 里面的type
                        } 
                        fs.writeFile( _root + ( conf.debug? path:pathMap(path) ), info, function (err) {}); 
                    }); 
                }); 
            }else if(stats && stats.isDirectory && stats.isDirectory()){ 
                fs.readdir(root+path,function(error,files){ 
                    for ( var i in files) {        //对应下级目录或资源文件 
                        build(path+'/'+files[i]); 
                    } 
                }); 
            } 
        }); 
    }; 
 
    exec('del '+_root+'* /s/q',function(err){ 
        if(!err){ 
            exec('xcopy '+root.replace(/(.*?)[\\\/]$/,'$1')+' '+_root+' /e/d/s', function (error, stdout, stderr) { 
                if (!error) { 
                    build(""); 
                } 
                resp.end(JSON.stringify({ 
                    error:error, 
                    command: 'xcopy '+root.replace(/(.*?)[\\\/]$/,'$1')+' '+_root+' /e/d/s' 
                })); 
            }); 
        }else{
            exec('rm -rf '+_root,function(err2){
				if(!err2){
				    exec('cp -Rf '+root+'* '+_root,function(err3){
				        if (!err3) { 
				            build(""); 
				        } 
				        resp.end(JSON.stringify({ 
				            error:err3, 
				            command: 'cp -Rf  '+root+'* '+_root 
				        }));
				    });
				}else{
				    resp.end(JSON.stringify({ 
				        error:'目录不存在: '+_root, 
				        command: 'xcopy '+root.replace(/(.*?)[\\\/]$/,'$1')+' '+_root+' /e/d/s' 
				    }));
				}
                
            }); 
                 
        } 
    }); 
         
}
