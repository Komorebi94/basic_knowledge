### MVVM与MVC

-   MVC是单向通信。也就是View跟Model，必须通过Controller（是页面业务逻辑）来承上启下
-   在MVVM的框架下视图和模型是不能直接通信的。它们通过ViewModel来通信，ViewModel通常要实现一个observer观察者，当数据发生变化，ViewModel能够监听到数据的这种变化，然后通知到对应的视图做自动更新，而当用户操作视图，ViewModel也能监听到视图的变化，然后通知数据做改动，这实际上就实现了数据的双向绑定，MVVM实现的是业务逻辑组件的重用
-   

### Nginx配置

-   全局块：配置影响nginx全局的指令。一般有运行nginx服务器的用户组，nginx进程pid存放路径，日志存放路径，配置文件引入，允许生成worker process数等
-   events块：配置影响nginx服务器或与用户的网络连接。有每个进程的最大连接数，选取哪种事件驱动模型处理连接请求，是否允许同时接受多个网路连接，开启多个网络连接序列化等。
-   http块：可以嵌套多个server，配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置。如文件引入，mime-type定义，日志自定义，是否使用sendfile传输文件，连接超时时间，单连接请求数等。
-   server块：配置虚拟主机的相关参数，一个http中可以有多个server。
-   location块：配置请求的路由，以及各种页面的处理情况。

```
    #指定nginx运行的用户及用户组,默认为nobody
    #user  nobody;   

    worker_processes  1;

    events {
        #设置工作模式为epoll,除此之外还有select,poll,kqueue,rtsig和/dev/poll模式
        #use epoll;
        
        #定义每个进程的最大连接数,受系统进程的最大打开文件数量限制。
        worker_connections  1024;
    }

    http {
        #主模块指令，实现对配置文件所包含的文件的设定，可以减少主配置文件的复杂度，DNS主配置文件中的zonerfc1912,acl基本上都是用include语句。
        include       mime.types;

        #核心模块指令，智力默认设置为二进制流，也就是当文件类型未定义时使用这种方式
        default_type  application/octet-stream;
        #开启高效文件传输模式
        sendfile        on;
        #开启防止网络阻塞
        #tcp_nopush     on;
        #开启防止网络阻塞
        #tcp_nodelay    on;

        #设置客户端连接保存活动的超时时间
        #keepalive_timeout  0;
        keepalive_timeout  65;

        #设置客户端请求读取超时时间
        #client_header_timeout 10;
        #设置客户端请求主体读取超时时间
        #client_body_timeout 10;
        #用于设置相应客户端的超时时间
        #send_timeout 

        #开启gzip压缩
        #gzip  on;
        
        #Nginx的server虚拟主机配置
        server {
            #监听端口为 80
            listen       80;

            #设置主机域名
            server_name  localhost;

            #设置访问的语言编码
            #charset koi8-r;

            #设置虚拟主机访问日志的存放路径及日志的格式为main
            #access_log  logs/host.access.log  main;

            #设置虚拟主机的基本信息
            location / {
                #设置虚拟主机的网站根目录
                root   html;

                #设置虚拟主机默认访问的网页
                index  index.html index.htm;
            }
        }
    }
```

### 正向代理反向代理

-   正向代理“代理”的是客户端，而且客户端是知道目标的，而目标是不知道客户端是通过VPN访问的。
-   反向代理是作用在服务器端的，是一个虚拟ip(VIP)。对于用户的一个请求，会转发到多个后端处理器中的一台来处理该具体请求。

### 代理转发

```
upstream my_server {                                                         
    server 10.0.0.2:8080;                                                
    keepalive 2000;
}
server {
    listen       80;                                                         
    server_name  10.0.0.1;                                               
    client_max_body_size 1024M;

    location /my/ {
        proxy_pass http://my_server;
        proxy_set_header Host $host:$server_port;
    }
}
```

### 重定向

```
    rewrite regex replacement [flag]; 
    rewrite ^/(.*) http://www.baidu.com/$1 permanent;
```

-   rewrite的含义：该指令是实现URL重写的指令。
-   regex的含义：用于匹配URI的正则表达式。
-   replacement：将regex正则匹配到的内容替换成 replacement。
-   flag: flag标记。
    -   last: 本条规则匹配完成后，继续向下匹配新的location URI 规则。(不常用)
    -   break: 本条规则匹配完成即终止，不再匹配后面的任何规则(不常用)。
    -   redirect: 返回302临时重定向，浏览器地址会显示跳转新的URL地址。
    -   permanent: 返回301永久重定向。浏览器地址会显示跳转新的URL地址。