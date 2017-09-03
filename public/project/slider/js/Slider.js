/**
* aouthor: alian wangzhuanglian 654849917@qq.com
* des    : Slider3.0.1 is a image slideshow plug-in for Zetop width features like touch,CSS3 transition and CSS3 transform.
*          Slider3.0.1 是一个我闲暇时间写的zepto插件，用于实现像微博、微信朋友圈展示多张图片的那种效果。可以滑动，缩放。基于JavaScript touch事件，zetop doubleTouch事件，和CSS3。
* version: 3.0.1
* depend : Zepto 1.1.6 + width 'zepto event touch ie'mode
*/


;(function($){
	'use strict';
	$.slider = function(options,callback){
		var Slider = {
			setting: {
				imgAry  : [],        //图片数组
				hasDot  : true,      //是否有点点
				isLoop  : false,     //是否有循环
				isFullScreen: true,  //是否全屏
				$el     : null,      //最外层元素
				autoSlide: false,    //是否自动滑动,自动滑动的情况下, isLoop会设置为true
				hasCloseBtn: false   //全屏的时候是否拥有关闭全屏的按钮，默认是点击一下关闭
			},
			$el        : null,
			$close     : null,
			$ul        : null,
			$li        : null,
			$nav       : null,
			$navli     : null,
			$imgs      : null,
			liLength   : 0,
			liWidth    : 0,
			ulWidth    : 0,
			indexNow   : 0,                                  //目前的index
			winWidth   : 0,                                  //屏幕宽度
			winHeight  : 0,                                  //屏幕高度
			loadNum    : 0,                                  //加载的图片数量
			initFingerDis : 0,                               //两个手指之间的距离
			isScale       : false,                           //是否处于缩放
			isScaling     : false,                           //是否正在缩放
			isSliding     : false,                           //是否正在滑动
			initImgX      : 0,                               //图片放大的时候初始触摸的X
			initImgY      : 0,	                             //图片放大的时候初始触摸的Y
			lastImgX      : 0,                               //图片放大的时候移动的X
			lastImgY      : 0,	                             //图片放大的时候移动的Y
			imgMoveX      : 0,                               //图片最终的移动X
			imgMoveY      : 0,                               //图片最终的移动Y
			initSlideX    : 0,                               //滑动开始时手指的X坐标
			initSlideY    : 0,                               //滑动开始时手指的Y的坐标
			lastSlideY    : 0,                               //滑动进行时手指的Y坐标
			lastSlideX    : 0,                               //滑动进行时手指的X的坐标
			moveLengthX   : 0,                               //滑动的X距离
			moveLengthY   : 0,                               //滑动的Y距离
			canMove       : undefined,                       //判断是否能移动
			minScale      : 1,                               //图片最小缩放倍数
			maxScale      : 3,                               //图片最大缩放倍数
			scaleArg      : 1,                               //图片缩放率
			finalScale    : 1,                               //最终的缩放率
			scale         : 1,                               //缩放的比例
			supportOrientation: false,                       //是否支持旋转事件
			resizetTimer  : null,                            //屏幕大小变化时使用的计时器
			destoryTimer  : null,                            //tap点击关闭组件计时器
			lastTouchTime : 0,                               //记录上一次点击时间
			isDoubleTap   : false,                           //是否双击
			init: function (data, callback){
				$.extend(this.setting, options || {});
				
				//是否支持Orientation事件
				this.supportOrientation  = (typeof window.orientation == "number" && typeof window.onorientationchage == "object");
				
				//插入样式
				this.appendStyle();

				//渲染
				this.render();

				//绑定事件
				this.onEvent();

				//自动滑动
				this.autoSlide();
			},
			render: function(){
				//根据是否全屏进行渲染
				if(this.setting.isFullScreen){
					this.fullScreenRender();
				}else{
					this.notfullScreenRender();
				}
			},
			onEvent: function(){
				var that = this;
				//滑动
				this.$el.on('touchstart',function(e){
					that.onTouchEvent.call(that,e);
				});
				//屏幕旋转
				if(this.supportOrientation){
					$(window).on('orientationchange', function(e){
						that.updateOrientation.call(that, e);
					}, false);
				}else{
					$(window).on('resize', function(e){
						that.updateOrientation.call(that, e);
					}, false);
				}
			},
			//初始化全屏
			fullScreenRender: function(){

				// if(this.$el && this.$el.length > 0){
				// 	this.show();
				// 	return
				// };
				var that = this,
					scrollTop = $(window).scrollTop();

				//生成基本元素
				var html = '<div class="slide-wrapper" id="J-slide-wrapper">'+
								'<ul class="slide"></ul>'+
								'<span class="slide-close" id="J-slide-colse">关闭</span>'+
							'</div>';

				this.$el           = $(html);
				this.$close        = this.$el.find('#J-slide-colse');
				this.$ul           = this.$el.find('ul');

				//添加进body
				$('body').append(this.$el);


				//显示隐藏关闭按钮
				if(!this.setting.hasCloseBtn){
					this.$close.hide();
				}

			},
			//初始化简单幻灯片
			notfullScreenRender: function(){
				this.$el = this.setting.$el;
				this.$el.addClass('slide-wrapper_n');
				this.setup();
			},
			setup: function(){
				var that = this;
				this.winWidth = $(window).width();
				this.winHeight =  $(window).height();
				this.liWidth = this.setting.isFullScreen ? this.winWidth : this.$el.width();
				this.liLength = this.setting.imgAry.length || this.$el.find('li').length;
				this.$ul = this.$ul || this.$el.find('ul').not('.slide-nav');
				this.$li = this.$ul.find('li');

				if(this.liLength < 2) this.setting.isLoop = false;
				if(this.setting.autoSlide && !this.setting.isFullScreen && this.liLength > 1) this.setting.isLoop = true;//如果是自动播放，自动设置为循环播放
				if(this.indexNow >= this.liLength) this.indexNow = this.liLength - 1;
				
				//添加点点
				this.appendDot();

				if(this.liLength < 3 && this.setting.isLoop){
					this.$ul.append(this.$li.eq(0).clone());
					this.$ul.append(this.$li.eq(1).clone());
					this.$li = this.$ul.find('li');
					this.liLength = this.$li.length;
				}

				//设置li宽度
				this.$li.width(this.liWidth);

				//定位
				this.$li.each(function(index){
					var moveX = that.indexNow > index ? -that.liWidth : (that.indexNow < index ? that.liWidth : 0);
					that.transform(0, {x:moveX , y:0}, $(this));
				});

				if(this.setting.isLoop){
					that.transform(0,{x: -this.liWidth, y:0 }, this.$li.eq(this.circle(this.indexNow - 1)));
					that.transform(0,{x: this.liWidth, y: 0}, this.$li.eq(this.circle(this.indexNow + 1)));
				}	

				if(this.setting.isFullScreen){
					var scrollTop = $(window).scrollTop();
					//最大化
					this.$el.css({'width' : this.winWidth,'height' : this.winHeight,'top' : scrollTop});
					var $imgs = this.$ul.find('img');
					$imgs.each(function(i, ele){
						that.initImg($imgs.eq(i));
					});
				}

				

				this.$el.css('visibility','visible');
			},	
			circle: function(index){
				return (this.liLength + (index % this.liLength)) % this.liLength;
			},
			imgOnload: function(e){
				this.loadNum++;
				this.initImg($(e.target))
				if(this.loadNum == this.liLength){
					//回调
					if(callback) callback();
				}
			},
			autoSlide: function(){
				var that = this;
				if(this.setting.autoSlide && !this.setting.isFullScreen){
					this.timer = setInterval(function(){
						that.movenext();
					},3000);
				}
			},
			appendDot: function(){
				//生成点点
				if(this.setting.hasDot && !this.$navli){
					this.$el.append('<ul class="slide-nav"></ul>');
					this.$nav = this.$el.find('.slide-nav');

					for(var i = 0; i < this.liLength; i++){
						this.$nav.append('<li></li>');
					}

					this.$navli =  this.$nav.find('li');
					this.$navli.eq(this.indexNow).addClass('on');
				}
			},
			appendImg: function(){
				var imgHtml = '',
				    that = this;
				//生成图片列表
				for(var i = 0; i < this.setting.imgAry.length; i++){
					imgHtml += '<li class="Route"><span class="slide-tips">加载中...</span><img src="'+ this.setting.imgAry[i] + '" /></li>';
				}

				this.$ul.html(imgHtml);
				this.$imgs = this.$ul.find('img');

				//设置img事件
				this.$imgs.on('load error emptied stalled',function(e){
					that.imgOnload.call(that,e);
				});
			},
			//初始化图片尺寸
			initImg: function($target){
				var imgHeight = $target[0].naturalHeight;
				var imgWidth  = $target[0].naturalWidth;
				if(!(imgWidth && imgHeight)){
					$target.html('<span class="slide-tips">加载失败</span>');
				}else{
					if(imgHeight > imgWidth && imgHeight > this.winWidth){
						var scaleH = this.winHeight/imgHeight;
						var scaleW = this.winWidth/imgWidth;

						if(scaleW * imgHeight > this.winHeight ){
							$target.css({'width': imgWidth * scaleH ,'height': this.winHeight});
						}else{
							$target.css({'width': this.winWidth , 'height': imgHeight * scaleW});
						}

					}else if(imgWidth >imgHeight  && imgWidth > this.winWidth){
						$target.css({'width': this.winWidth });
					}
					$target.prev().remove();
					$target.show();
				}

			},
			onTouchEvent: function(e){
				var that = this,
					type = e.type,
					touches = e.touches || [],
					$zoomTarget =  this.$li.eq(this.indexNow);
				if (e.preventDefault && this.setting.isFullScreen) e.preventDefault();

				//关闭
				if(this.setting.hasCloseBtn){
					if($(e.target).attr('id') === 'J-slide-colse'){this.hide(); return;}
				}
				switch(type){
					case 'touchstart':
						//判断是否双击
						this.doubleTapOrNot(touches.length);

						//停止自动播放
						if(!this.isFullScreen) clearInterval(this.timer);

						//缩放
						if(touches.length === 2 && this.setting.isFullScreen){
							this.initFingerDis = this.fingersDistance(touches);
						//缩放之后的移动
						}else if(touches.length === 1 && this.isScale && !this.isSliding){
							this.initImgX = touches[0].clientX - this.imgMoveX;
							this.initImgY = touches[0].clientY - this.imgMoveY;
						//滑动的移动
						}else if(touches.length === 1 && !this.isScale){
							this.initSlideX = this.lastSlideX = touches[0].clientX;
							this.initSlideY = this.lastSlideY = touches[0].clientY;
							this.moveLength = 0;
						}

						this.$el.on('touchmove touchend', function(e){
							that.onTouchEvent.call(that,e);
						});
						break;
					case 'touchmove':
						//console.log('touchmove');

						//两只手指放大
						if(touches.length === 2 && !this.isSliding  && this.setting.isFullScreen){
								this.isScale = true;
								this.isScaling = true;
								this.lastFingerDis = this.fingersDistance(touches);
								var rate = this.lastFingerDis / this.initFingerDis;
								this.scale = rate * this.finalScale;
								this.transform(0,{scale:this.scale}, this.$li.eq(this.indexNow))
						//放大的时候移动图片
						}else if(touches.length === 1 && this.isScale && !this.isSliding){
								this.isScaling = true;
								this.lastImgX = touches[0].clientX;
								this.lastImgY = touches[0].clientY;
								this.imgMoveX = this.lastImgX - this.initImgX;
								this.imgMoveY = this.lastImgY - this.initImgY;

								//移动图片
								this.transform(0 ,{x: this.imgMoveX, y: this.imgMoveY, scale: this.finalScale}, $zoomTarget);

						//滑动
						}else if(touches.length === 1){
							this.lastSlideX = touches[0].clientX;
							this.lastSlideY = touches[0].clientY;
							this.moveLengthX = this.lastSlideX - this.initSlideX;
							this.moveLengthY = this.lastSlideY - this.initSlideY;

							if(this.canMove == undefined){
								this.canMove = (Math.abs(this.moveLengthX) >= Math.abs(this.moveLengthY));
							}
							if(this.canMove || this.setting.isFullScreen){
								this.isSliding = true;
								e.preventDefault();
								if(this.setting.isLoop){
									this.transform(0, {x: -that.liWidth + that.moveLengthX, y: 0}, this.$li.eq(this.circle(this.indexNow - 1)));
									this.transform(0, {x: that.moveLengthX, y: 0}, this.$li.eq(this.circle(this.indexNow)));
									this.transform(0, {x: that.liWidth + that.moveLengthX, y: 0}, this.$li.eq(this.circle(this.indexNow + 1)));
								}else{
									this.moveLengthX = 
										this.moveLengthX /
											(
												(!this.indexNow && this.moveLengthX > 0
												|| this.indexNow == this.liLength - 1 && this.moveLengthX < 0
												) ?
												(Math.abs(this.moveLengthX) / this.liWidth + 1) : 1
											);
									if(this.indexNow) this.transform(0, {x: (-that.liWidth + that.moveLengthX),  y:0}, this.$li.eq(this.indexNow - 1));
									this.transform(0, {x:(that.moveLengthX), y:0}, this.$li.eq(this.indexNow));
									if(this.indexNow + 1 < this.liLength ) this.transform(0, {x: (that.liWidth + that.moveLengthX), y:0}, this.$li.eq(this.indexNow + 1));
								}
							}
						}

						break;
					case 'touchend':
						//console.log('touchend');

						this.$el.off('touchmove touchend');
						
						//单击关闭
						this.tapClose();

						//是否是双击
						this.doubleTap();

						//滑动后重置silder位置
						this.resetSliderPosition();

						//放大后重置图片位置
						this.resetImgPosition();

						//如果有自动播放，自动播放
						if(!this.isFullScreen) this.autoSlide();

						this.isSliding = false;
						this.canMove = undefined;
						this.moveLengthX = 0;
						this.moveLengthY = 0;
						this.isScaling 	= false;

						break;
						
				}
			},
			tapClose: function(){
				var that = this;
				//如果只是简单的点击，且没有关闭按钮，关闭全屏
				if(this.setting.isFullScreen  && !this.setting.hasCloseBtn && !this.isSliding && !this.isScaling){
					clearTimeout(this.destoryTimer);
					this.destoryTimer = setTimeout(function(){
							that.finalScale = 1;
							that.isScale = false;
							that.hide(); 
							return;
					},250);
				}
			},
			doubleTapOrNot:function(touchesLength){
				var now =  Date.now();
				var touchDelay = now - (this.lastTouchTime||now);
				this.lastTouchTime = now;
				if(touchDelay > 0 && touchDelay < 250 && touchesLength < 2){
					this.isDoubleTap = true;
				}
			},
			doubleTap: function(){
				console.log(this.isDoubleTap);
				if(this.isDoubleTap && this.setting.isFullScreen && !this.isSliding && !this.isScaling){

					// console.log(this.destoryTimer);
					if(this.isScale){
						//重置finalScale,和moveX，moveY
						this.finalScale = 1;
						this.imgMoveY = 0;
						this.imgMoveX = 0;
						this.isScale = false;
					}
					else{
						//重置finalScale,和moveX，moveY
						this.scale = this.finalScale = 1.6;
						this.imgMoveY = 0;
						this.imgMoveX = 0;
						this.isScale = true;
					}
					this.transform(3 , {x: this.imgMoveX, y: this.imgMoveY, scale: this.finalScale}, this.$li.eq(this.indexNow));
				}
				if(this.isDoubleTap){
					clearTimeout(this.destoryTimer);
					this.isDoubleTap = false;
				} 

				
			},	
			resetSliderPosition: (function(){
				var timer = null;
				return function(){
					var that = this;
					if(this.isScale) return;

					var l = this.moveLengthX;
					var canMovePre =  this.indexNow != 0 || this.setting.isLoop,
						canMoveNext = this.indexNow != this.liLength - 1 || this.setting.isLoop;
					if(l < 0 && Math.abs(l) > 80 && canMoveNext){
						console.log('moveToLeft');
						this.movenext();
					}else if(l > 0 && Math.abs(l) > 80 && canMovePre){
						console.log('moveToRight');
						this.moveprev();
					}else{
						if(this.setting.isLoop || (!this.setting.isLoop && this.indexNow)) {
							this.transform(3, {x: -this.liWidth, y: 0}, this.$li.eq(this.circle(this.indexNow - 1)));
						}
						this.transform(3, {x: 0, y: 0}, this.$li.eq(this.indexNow));
						if(this.setting.isLoop || (!this.setting.isLoop && this.indexNow + 1 < this.liLength)){
							this.transform(3, {x: this.liWidth, y: 0}, this.$li.eq(this.circle(this.indexNow + 1)));
						}
					}
					clearTimeout(timer);
				}
				
			})(),
			resetImgPosition: function(){
				if(!this.isScale) return;
				
				var $img = this.$li.eq(this.indexNow).find('img');
				var $zoomTarget = this.$li.eq(this.indexNow);
				//缩放倍数和状态重置
				if(this.scale <= this.minScale){
					//重置finalScale,和moveX，moveY
					this.finalScale = 1;
					this.imgMoveY = 0;
					this.imgMoveX = 0;
					this.transform(3 , {scale:1}, $zoomTarget);
					this.isScale = false;
				}else{
					this.finalScale = this.scale;
				}

				var imgWidth = $img.width(),
					imgHeight = $img.height();

				//上下边界的界定
				var set = (this.winHeight - imgHeight)/2;
				if(set > 0){
					if(this.imgMoveY < -set){
						this.imgMoveY = -set;
					}else if(this.imgMoveY > set){
						this.imgMoveY = set;
					}
				}else{
					if(this.imgMoveY < set){
						this.imgMoveY = set;
					}else if(this.imgMoveY >　-set){
						this.imgMoveY = -set;
					}
				}

				set = (this.winWidth - imgWidth)/2;
				if(set > 0){
					if(this.imgMoveX < -set){
						this.imgMoveX = -set;
					}else if(this.imgMoveX > set){
						this.imgMoveX = set;
					}
				}else{
					if(this.imgMoveX < set){
						this.imgMoveX = set;
					}else if(this.imgMoveX > -set){
						this.imgMoveX = -set;
					}
				}

				//移动图片
				this.transform(3 ,{x: this.imgMoveX, y: this.imgMoveY,scale: this.finalScale}, $zoomTarget);

			},
			slide: function(){
				var that = this;

				this.movenext();
				this.timer = setTimeout(function(){
					that.slide.call(that);
				}, 2000);
			},
			moveprev: function(){
				if(!this.setting.isLoop && !this.indexNow) return;

				//移动
				this.move(this.indexNow - 1);

			},
			movenext: function(){

				if(!this.setting.isLoop && this.indexNow + 1 > this.liLength - 1) return;

				//移动
				this.move(this.indexNow + 1);

			},
			move: function(to){
				var direction = Math.abs(this.indexNow - to) / (this.indexNow - to);
				
				var to = this.circle(to);
				this.transform(3, {x: this.liWidth * direction, y: 0}, this.$li.eq(this.indexNow));
				this.transform(3, {x: 0, y: 0}, this.$li.eq(to));
				if(this.setting.isLoop) this.transform(0, {x: -this.liWidth * direction, y: 0}, this.$li.eq(this.circle(to - direction )));
				this.indexNow =to;
				
				//点点
				if(this.setting.hasDot){
					if(this.$navli.length <=2) to = to % 2;
					this.$navli.removeClass('on');
					this.$navli.eq(to).addClass('on');
				}
			},
			transform : function(duration, transform, $target){
				$target.css({
					'-webkit-transform' : 'translate3d(' + (transform.x || 0) + 'px, '+ (transform.y || 0) +'px, 0px) scale('+ (transform.scale || 1) +')',
					'-moz-transform' 	: 'translate3d(' + (transform.x || 0) + 'px, '+ (transform.y || 0) +'px, 0px) scale('+ (transform.scale || 1) +')',
					'-o-transform' 		: 'translate3d(' + (transform.x || 0) + 'px, '+ (transform.y || 0) +'px, 0px) scale('+ (transform.scale || 1) +')',
					'-ms-transform' 	: 'translate3d(' + (transform.x || 0) + 'px, '+ (transform.y || 0) +'px, 0px) scale('+ (transform.scale || 1) +')',
					'transform'         : 'translate3d(' + (transform.x || 0) + 'px, '+ (transform.y || 0) +'px, 0px) scale('+ (transform.scale || 1) +')', 

					'-webkit-transition-duration': '0.'+ duration+'s',
					'-moz-transition-duration': '0.'+ duration+'s',
					'-ms-transition-duration': '0.'+ duration+'s',
					'-o-transition-duration': '0.'+ duration+'s',
					'transition-duration': '0.'+ duration+'s',

					'-webkit-transform-origin'  : transform.origin || '50% 50% 0',
					'-moz-transform-origin'  : transform.origin || '50% 50% 0',
					'-o-transform-origin'   : transform.origin || '50% 50% 0',
					'-ms-transform-origin'  : transform.origin || '50% 50% 0',
					'transform-origin'  	: transform.origin || '50% 50% 0'
				});
			},
			fingersDistance:function(touches){
				var e0 = touches[0] || {},
				e1 = touches[1] || {},
				x0 = e0.clientX || 0,
				x1 = e1.clientX || 0,
				y0 = e0.clientY || 0,
				y1 = e1.clientY || 0,
				disX = Math.abs(x0 - x1),
				disY = Math.abs(y0 - y1);

				return Math.sqrt(disX * disX + disY * disY);
			},
			updateOrientation: function(){

				var that = this;

				if(this.supportOrientation){
					that.setup(true);
				}else{

					clearTimeout(this.resizetTimer);
					this.resizetTimer = setTimeout(function(){
						that.setup(true);
					}, 300);
				}
			},
			appendStyle:function(){
				if($('#J_slide-style').length <= 0){
					var $style = $('<style id="J_slide-style">.slide-wrapper{display:none}.slide-wrapper li,.slide-wrapper ul{padding:0;margin:0}.slide-wrapper{overflow:hidden;margin-bottom:20px;background:rgba(0,0,0,.7);display:none;position:absolute;left:0;top:0;width:100%;height:100%}.slide-wrapper .slide{height:100%;position:absolute;left:0;top:0}.slide-wrapper li{width:100%;height:100%;position:absolute;left:0;top:0;list-style:none}.slide-wrapper p{padding-left:5px;font-size:16px;line-height:20px;margin:0}.slide-wrapper img{display:block;position:absolute;left:50%;top:50%;display:none;transform-origin:50% 50%;-webkit-transform-origin:50% 50%;-ms-transform-origin:50% 50%;-moz-transform-origin:50% 50%;-o-transform-origin:50% 50%;transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);-webkit-transform:translate(-50%,-50%);-o-transform:translate(-50%,-50%);-moz-transform:translate(-50%,-50%)}.slide-nav{position:absolute;left:50%;bottom:1px;transform:translateX(-50%);-ms-transform:translateX(-50%);-webkit-transform:translateX(-50%);-o-transform:translateX(-50%);-moz-transform:translateX(-50%);z-index:100;background:0 0}.slide-nav li{position:static;display:inline-block;margin:3px;border-radius:100px;opacity:.8;background:rgba(255,255,255,.6);width:5px;height:5px}.slide-nav li.on{background:rgba(255,255,255,1)}.slide-tips{position:absolute;top:50%;color:#fff;height:20px;width:100%;margin-top:-10px;line-height:20px;display:block;text-align:center;z-index:100}.slide-nav{position:absolute;left:50%;bottom:1px;transform:translateX(-50%);-ms-transform:translateX(-50%);-webkit-transform:translateX(-50%);-o-transform:translateX(-50%);-moz-transform:translateX(-50%);z-index:100;background:0}.slide-nav li{display:inline-block;margin:3px;border-radius:100px;opacity:.8;background:rgba(255,255,255,.6);width:5px;height:5px}.slide-nav li.on{background:rgba(255,255,255,1)}#J-slide-colse{display:block;width:15%;height:25px;color:#fff;text-align:center;line-height:25px;position:absolute;bottom:5%;left:10px;border-radius:3px;z-index:10000;border:1px solid #3079ed;background-color:#4d90fe}.slide-wrapper_n{overflow:hidden;visibility:hidden}.slide-wrapper_n li,.slide-wrapper_n ul{margin:0;padding:0}.slide-wrapper_n ul{width:100%;position:relative;left:0;top:0}.slide-wrapper_n li{position:absolute;left:0;top:0;list-style:none}.slide-wrapper_n .slide-nav{position:absolute;width:auto;left:50%;bottom:1px;top:auto;transform:translateX(-50%);-ms-transform:translateX(-50%);-webkit-transform:translateX(-50%);-o-transform:translateX(-50%);-moz-transform:translateX(-50%);z-index:100;background:none}.slide-wrapper_n .slide-nav li{position:static;float:left;margin:3px;border-radius:100px;opacity:0.8;background:rgba(255,255,255,0.6);width:5px;height:5px}.slide-wrapper_n .slide-nav li.on{background:rgba(255,255,255,1)}</style>');
					$('head').append($style);
				}
			},
			destory:function(e){
				if(this.$close){
					this.$close.off('touchstar');
					this.$close = null;
				}
				if(this.$imgs){
					this.$imgs.off('load error emptied stalled');
					this.$imgs = null;
				}
				if(this.$el){
					this.$el.off('touchstar touchmove touchend').remove();
					this.$el = null;
				}
			},
			hide:function(){
				this.$el.hide();
			},
			show:function(indexNow,imgAry){
				if(indexNow != undefined) this.indexNow = indexNow;
				if(imgAry != undefined) this.setting.imgAry = imgAry;

				//插入图片
				this.appendImg();
				this.setup();
				this.$el.show();
			}
		}



		Slider.init();


		return Slider;
	};
})(window.Zepto);
