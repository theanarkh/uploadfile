/*
  author cyb
  date 14/12/2016 20:59
  created by sublime3
  文件上传组件
*/
function uploadfile(config) {
  this.element = config.element;
  this.url = config.url || 'http://localhost/uploads.php';
  this.loading = config.loading;//上传文件时执行的函数
  this.success = config.success;
  this.fail = config.fail;
  this.fileSize = String(config.fileSize);
  this.types = config.types.replace(/\s/g,'');;
  this.id = 0;
  this.addition = config.addition;//$.extend(config.addition || {},{fileId: function() { return new Date().getTime() }});//上传时需要额外传的参数
  this.multiple = config.multiple;//是否支持一次上传多个文件
  this._beforeUpload = config.beforeUpload;//上传前需要执行的函数
  this.uuid = this.getUuid();//每个上传的元素对应一个唯一的uuid
  this.fileIdPrefix = config.fileIdPrefix || '_file';//file元素对应id后缀
  this.formIdPrefix = config.formIdPrefix || '_form';
  this.iframeIdPrefix = config.iframeIdPrefix || '_iframe';
  this.reportFileInfo = config.reportFileInfo || true;
  this.init();
}

uploadfile.prototype.init = function() {
  this.bindElement();
}

uploadfile.prototype.bindElement = function() {
  var self = this;
  $(this.element).click(function() {
    if (self.beforeUpload() === false) {
        return false;
    }
    self.updateId();//懒加载，每次点击上传按钮时渲染上传组件，并且赋予一个唯一的id
    self.initUploadComponent();//渲染上传组件
    $('#' + self.getFileId()).change(self.callback.call(self)).trigger('click');//绑定file的change事件并且立刻触发
  })
}

uploadfile.prototype.beforeUpload= function() {//返回值为false时不进行上传操作
  if (this._beforeUpload && this.isFunction(this._beforeUpload) && this._beforeUpload() === false) {
    return false;
  }
  else {
    return true;
  }
}

uploadfile.prototype.initUploadComponent = function() {
    var _iframe = this.createElement('Iframe');
    document.body.appendChild(_iframe);
    var _form = this.createElement('Form',{url:this.url});
    var _file = this.createElement('Input');
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var addition = this.addition;
    
    for (var key in addition) {//给form加入hidden元素，保存上传文件时需要传的参数，比如username,csrfCode等
        if(hasOwnProperty.call(addition,key)) {
          var value = this.isFunction(addition[key]) ? addition[key].call(this) : addition[key];
          _form.appendChild(this.createElement('Input',{type:'hidden',name: key,value: value}));
        }
    }
    _form.appendChild(_file);
    document.body.appendChild(_form);
}


uploadfile.prototype.callback = function() {//选择文件后执行的回调
  var self = this;
  return function() {
      var files ;
      if (this.files) {//大部分浏览器支持files属性和多文件上传
          files = this.files; 
      }
      else {//ie9以下的浏览器不支持files属性和多文件上传，修复这个files对象，但是无法进行文件大小的校验
        var name = this.value.split('\\').pop();
        var size = 0 ;//无法获取文件大小，默认为0，保证校验通过
        files = [{
          name: name,
          size: size
        }];
      }
      
      var len = files.length;
      var data = [];
      for (var i = 0; i<len;i++) {
          data.push({fileName:files[i]['name'],fileId: self.getFileRequetId()})
      }
      var result = self.check(files);
      var form = $('#'+ self.getFormId());
      if (result.code == self.constant.FILE_SUCCESS) {
        if (self.reportFileInfo) {//上报上传的文件信息，包括本次请求id和所有文件对应的文件id，方便出错时前端知道哪些文件上传出错或者所有的文件都上传出错
            var hidden = self.createElement('Input',{type: 'hidden',name: 'fileInfo', value: JSON.stringify(data)});
            var uploadRequestId = self.createElement('Input',{type: 'hidden',name: 'uploadRequestId', value: new Date().getTime()})
            form.append(hidden);
            form.append(uploadRequestId);
        }
        form.submit();
        self.loading && self.loading(data);
      } 
      else if (result.code == self.constant.FILE_TYPE_ERROR){
          self.fail && self.fail(result);
      }
      else if (result.code == self.constant.FILE_SIZE_ERROR){
          self.fail && self.fail(result);
      }
      
      $('#'+ self.getFileId()).off().remove();//卸载file组件的所有事件然后删除，防止内存泄漏
      form.html('').remove();//清空form然后删除，防止内存泄漏
  }
}


uploadfile.prototype.check = function(files) {//选择文件后进行合法性检查
  var self = this;
  var types = this.types;
  var fileSize = this.fileSize.replace(/\s/g,'').replace(/k|g|m/ig,function(type) {
      return "*" + self.constant[type.toUpperCase()];
  });
  fileSize = new Function('return ' + fileSize)();//处理文件大小，支持1,1k,'1'三种形式
  
    for(var i = 0; i< files.length; i++) {
      var suffix =  files[i]['name'].replace(/[\s\S]*\./,'');
    
      if (types.indexOf(suffix) == -1) {//文件类型不符合
         return {code: self.constant.FILE_TYPE_ERROR,fileName: files[i]['name'],msg:'file type error!'}
      }
      else if (files[i]['size'] > fileSize){//文件大小不符合
        return {code: self.constant.FILE_SIZE_ERROR,fileName: files[i]['name'],msg:'size is too large!'}
      }
    }
    return {code:10000};//文件合法
}

uploadfile.prototype.getUuid = (function(){//如果页面中有多个元素需要上传文件，给每个元素赋一个唯一的uuid
    var uuid = 0;
    return function() {
      return ++uuid;
    }
})();

uploadfile.prototype.getFileRequetId = (function() {//上传文件时，每次上传对应一个请求id，不同的上传元素共享这个获取请求id的函数
    var fileId = 0;
    return function() {
       return ++fileId;
    }
})();

uploadfile.prototype.getCurrentId = function() {//获取某个上传元素对应的当前id
  return this.id;
}

uploadfile.prototype.updateId = function() {//更新某个上传元素对应的id
  return ++this.id;
}

uploadfile.prototype.getIdSuffix = function() {//获取id前缀，由每个上传元素的uuid和当前id组成，保证唯一性
    return this.uuid + "" + this.getCurrentId();
}

uploadfile.prototype.getIframeId = function() {//获取元素的id
  return this.iframeIdPrefix + this.getIdSuffix();
}

uploadfile.prototype.getFormId = function() {
  return this.formIdPrefix + this.getIdSuffix();
}

uploadfile.prototype.getFileId = function() {
  return this.fileIdPrefix + this.getIdSuffix();
}

uploadfile.prototype.createElement = function(type,config) {//创建元素方法
  return this.createElementFactory(type,config);
}
uploadfile.prototype.createElementFactory = function(type,config) {//创建元素的工厂方法
  return this['create'+type](config);
}

uploadfile.prototype.createIframe = function(config) {//创建iframe
  config = config || {};
  var _iframe = document.createElement('iframe');
  _iframe.id = config.id || this.getIframeId();
  _iframe.name = config.name || this.getIframeId();
  _iframe.src = config.url || '';
  _iframe.style.display = config.display || 'none';
  var self = this;
  
  _iframe.callback = function(ret) {//上传文件后的回调
     
     if(ret && ret.code === 0) {
        self.success && self.success.call(null,ret);
     }
     else {
        self.fail && self.fail.call(null,ret);
     }
     _iframe.callback = null;//把callback置null,防止内存泄漏
     $('#' + self.getIframeId()).remove();//销毁请求已经返回的iframe
  }
  return _iframe;
}
uploadfile.prototype.createForm = function(config) {
  config = config || {};
  var _form = document.createElement('form');
  _form.id = this.getFormId();
  _form.action = config.url;
  _form.method = 'post';
  _form.style.display = 'none';
  _form.target = this.getIframeId();
  _form.enctype = 'multipart/form-data';
  return _form;
}

uploadfile.prototype.createInput = function(config) {
  config = config || {};  
  var _input = document.createElement('input');
  if(config.type == 'file' || !config.type) {//创建file组件
      _input.type = 'file';
      _input.id = this.getFileId();
      _input.name = 'uploadfile';
      this.types && (_input.accept = this.getAcceptType());//限制上传文件的格式
      this.multiple && (_input.multiple = 'multiple',_input.name += '[]');//是否需要同时上传多个文件，上传多个文件时name需要加上[]
  }
  else {//创建input下的其他类型组件，这里只用于创建hidden组件
      _input.type = config.type;
      config.id && (_input.id = config.id);
      _input.name = config.name;
      _input.value = config.value;
  }
 
  return _input;
}

uploadfile.prototype.getAcceptType = function() {
    var types = this.types.split(',');
    var MIME= this.constant.MIME;
    for (var i=0;i<types.length;i++) {
      types[i] = MIME[types[i]];
    }
    return types.join(',');
}

uploadfile.prototype.constant = {//定义上传文件组件需要用到的常量
    FILE_SUCCESS: 10000,//文件符合上传的规则
    FILE_TYPE_ERROR: 10001,//文件类型错误
    FILE_SIZE_ERROR: 10002,//文件大小错误
    K: 1024,//1kb等于1024字节
    G: 1024*1024*1024,
    M: 1024*1024,
    MIME: {
      avi: 'video/x-msvideo',
      c: 'text/plain',
      css: 'text/css',
      dll: 'application/x-msdownload',
      dms: 'application/octet-stream',
      doc: 'application/msword',
      exe: 'application/octet-stream',
      gif: 'image/gif',
      gtar:  'application/x-gtar',
      gz : 'application/x-gzip',
      h: 'text/plain',
      htm: 'text/html',
      html:  'text/html',
      ico: 'image/x-icon',
      jpe: 'image/jpeg',
      jpeg:  'image/jpeg',
      jpg :'image/jpeg',
      png :'image/png',
      js : 'application/x-javascript',
      pps: 'application/vnd.ms-powerpoint',
      ppt: 'application/vnd.ms-powerpoint',
      sh : 'application/x-sh',
      swf: 'application/x-shockwave-flash',
      tar: 'application/x-tar',
      zip: 'application/zip,application/application/x-zip-compressed',
      'tar.gz': 'application/x-gzip',
      pdf: 'application/pdf',
      cpp: 'text/plain'
    }
}

uploadfile.prototype.isFunction = function(variable) {
    return Object.prototype.toString.call(variable) === '[object Function]';
}