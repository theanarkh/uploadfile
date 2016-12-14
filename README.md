# uploadfile
上传文件组件<br>该组件思路：每次的上传文件时都会对应一套上传的组件，包括file,form,iframe,每套组件相互独立。在点击上传按钮时渲染，触发change事件和上传文件请求返回时进行组件的删除。之所以这样做是因为一直有一个难题无法解决，1.本来想用一个iframe接收所有form请求的返回结果，但是由于强迫症，如果两个请求同时返回，极端的情况，请求一刚返回，浏览器正在解析iframe，然后第二个请求也返回了，那么这个返回的结果会不会覆盖前面的解析，也就是说导致前面解析的终止，这样第一次返回结果就丢失了。2.如果每次上传都对应一个iframe，也就是新建一个iframe，form和file可以复用，不需要新建，这样每次请求的时候，都需要修改form的target，form1对应iframe1，这时候form1发送请求，然后新建iframe2，修改form1的target指向iframe2，如果前面发出的请求这时候返回，但是form1已经指向iframe2，这样是否是有影响。所以最后用了每次上传都是独立的的思路，损失了性能，因为需要动态不断地操作DOM。<br>
1.支持跟踪每次请求的结果，每次请求中的每个文件的上传结果。<br>
2.支持上传文件前，鉴权，文件检验。<br>
3.支持文件上传请求增加额外参数，比如username,csrfCode。<br>
