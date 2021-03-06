// ~~ Dialog 兼容子元素和 iFrame
class RbDialog extends React.Component {
    constructor(props) {
        super(props)
        this.state = { ...props }
    }
    render() {
        let inFrame = !!!this.props.children
        return (<div className="modal rbmodal colored-header colored-header-primary" ref="rbmodal">
            <div className="modal-dialog" style={{ maxWidth:(this.props.width || 680) + 'px' }}>
                <div className="modal-content">
                    <div className="modal-header modal-header-colored">
                        <h3 className="modal-title">{this.props.title || '无标题'}</h3>
                        <button className="close" type="button" onClick={()=>this.hide()}><span className="zmdi zmdi-close"></span></button>
                    </div>
                    <div className={'modal-body' + (inFrame ? ' iframe rb-loading' : '') + (inFrame && this.state.frameLoad !== false ? ' rb-loading-active' : '')}>
                        {this.props.children || <iframe src={this.props.url} frameBorder="0" scrolling="no" onLoad={()=>this.resize()}></iframe>}
                        {inFrame && <RbSpinner />}
                    </div>
                </div>
            </div>
        </div>)
    }
    componentDidMount() {
        this.show()
    }
    show() {
        let root = $(this.refs['rbmodal'])
        root.modal({ show: true, backdrop: 'static' })
        typeof this.props.onShow == 'function' && this.props.onShow(this)
    }
    hide() {
        let root = $(this.refs['rbmodal'])
        root.modal('hide')
        if (this.props.disposeOnHide === true) {
            root.modal('dispose')
            let container = root.parent()
            ReactDOM.unmountComponentAtNode(container[0])
            setTimeout(()=>{ container.remove() }, 200)
        }
        typeof this.props.onHide == 'function' && this.props.onHide(this)
    }
    resize() {
        if (!!this.props.children) return
        let root = $(this.refs['rbmodal'])
        let that = this
        $setTimeout(function(){
            let iframe = root.find('iframe')
            let height = iframe.contents().find('.main-content').height()
            if (height == 0) height = iframe.contents().find('body').height()
            else height += 45;  // .main-content's padding
            root.find('.modal-body').height(height)
            that.setState({ frameLoad: false })
        }, 100, 'RbDialog-resize')
    }
}

//~~ Dialog 处理器
class RbDialogHandler extends React.Component {
    constructor(props) {
        super(props)
        this.state = { ...props }
        this.show = this.show.bind(this)
        this.hide = this.hide.bind(this)
    }
    show(state, call) {
        let callback = ()=>{
            if (this.refs['dlg']) this.refs['dlg'].show()
            typeof call == 'function' && call(this)
        }
        if (state && $.type(state) == 'object') this.setState(state, callback)
        else callback()
    }
    hide() {
        if (this.refs['dlg']) this.refs['dlg'].hide()
    }
}

// ~~ Form 处理器
class RbFormHandler extends RbDialogHandler {
    constructor(props) {
        super(props)
        this.handleChange = this.handleChange.bind(this)
    }
    handleChange(e){
        let target = e.target
        let id = target.dataset.id
        let val = target.type === 'checkbox' ? target.checked : target.value
        let s = {}
        s[id] = val
        this.setState(s)
    }
}

// ~~ 弹出窗口
class RbModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = { ...props, inLoad: true, isDestroy: false }
    }
	render() {
		return (this.state.isDestroy == true ? null :
			<div className="modal rbmodal colored-header colored-header-primary" ref="rbmodal">
		        <div className="modal-dialog" style={{ maxWidth:(this.props.width || 680) + 'px' }}>
    		        <div className="modal-content">
        		        <div className="modal-header modal-header-colored">
            		        <h3 className="modal-title">{this.state.title || 'RbModal'}</h3>
            		        <button className="close" type="button" onClick={()=>this.hide()}><span className="zmdi zmdi-close"></span></button>
            		    </div>
            		    <div className={'modal-body rb-loading' + (this.state.inLoad ? ' rb-loading-active' : '') + (this.state.url ? ' iframe' : '')}>
            		        {this.props.children || <iframe src={this.state.url || 'about:blank'} frameBorder="0" scrolling="no" onLoad={()=>this.resize()}></iframe>}
                            <RbSpinner />
                        </div>
    		        </div>
		        </div>
			</div>
		)
	}
	componentDidMount() {
	    if (this.props.children) this.setState({ inLoad: false })
	    this.show(this.props.onShow)
    }
	resize() {
        if (!!!this.state.url) return  // 非 iframe 无需 resize
        
        let root = $(this.refs['rbmodal'])
        let that = this
        $setTimeout(function(){
            let iframe = root.find('iframe')
            let height = iframe.contents().find('.main-content').height()
            if (height == 0) height = iframe.contents().find('body').height()
            else height += 45;  // .main-content's padding
            root.find('.modal-body').height(height)
            that.setState({ inLoad: false })
        }, 100, 'RbModal-resize')
    }
	show(callback) {
        let that = this
	    this.setState({ isDestroy: false }, function(){
	        $(that.refs['rbmodal']).modal({ show: true, backdrop: 'static' })
            typeof callback == 'function' && callback(that)
        })
    }
    hide(){
        let root = $(this.refs['rbmodal'])
        let warp = root.parent()
        root.modal('hide')
        let destroy = true
        if (this.props.destroyOnHide == false) destroy = false
        else root.modal('dispose')
        this.setState({ isDestroy: destroy, inLoad: destroy  }, ()=>{
            if (destroy == true) {
                setTimeout(() => { warp.remove() }, 200)
            }
            
            // 如果还有其他 modal 处于 open 态， 则保持 modal-open，否则主窗口滚动条会消失
            if ($('.rbmodal.show').length > 0) $(document.body).addClass('modal-open')
        })
    }
}

// ~~ 提示框
class RbAlert extends React.Component {
    constructor(props) {
       super(props)
    }
    render() {
        let icon = this.props.type == 'danger' ? 'alert-triangle' : 'info-outline'
        let type = this.props.type || 'primary'
        let content = !!this.props.htmlMessage ? <div className="mt-3" style={{ lineHeight:1.8 }} dangerouslySetInnerHTML={{ __html : this.props.htmlMessage }}></div> : <p>{this.props.message || '提示内容'}</p>
        let confirm = (this.props.confirm || this.hide).bind(this)
        return (
            <div className="modal rbalert" ref="rbalert" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header pb-0">
                            <button className="close" type="button" onClick={()=>this.hide()}><span className="zmdi zmdi-close"></span></button>
                        </div>
                        <div className="modal-body">
                            <div className="text-center ml-6 mr-6">
                                <div className={'text-' + type}><span className={'modal-main-icon zmdi zmdi-' + icon}></span></div>
                                {this.props.title && <h4 className="mb-2 mt-3">{this.props.title}</h4>}
                                <div className={this.props.title ? '' : 'mt-3'}>{content}</div>
                                <div className="mt-4 mb-3">
                                    <button className="btn btn-space btn-secondary" type="button" onClick={()=>this.hide()}>取消</button>
                                    <button className={'btn btn-space btn-' + type} type="button" onClick={confirm}>{this.props.confirmText || '确定'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    componentDidMount() {
        $(this.refs['rbalert']).modal({ show: true, keyboard: true })
    }
    hide() {
        let root = $(this.refs['rbalert'])
        root.modal('hide')
        setTimeout(function(){
            root.modal('dispose')
            root.parent().remove() 
        }, 1000)
    }
}

// ~~ 提示条
class RbNotice extends React.Component {
    constructor(props) {
       super(props)
       this.state = { animatedClass: 'slideInDown' }
    }
    render() {
        let icon = this.props.type == 'success' ? 'check' : 'info-outline'
        icon = this.props.type == 'danger' ? 'close-circle-o' : icon
        let content = !!this.props.htmlMessage ? <div className="message" dangerouslySetInnerHTML={{ __html : this.props.htmlMessage }}></div> : <div className="message">{this.props.message}</div>
        return (<div ref="rbnotice" className={'rbnotice animated faster ' + this.state.animatedClass}>
            <div className={'alert alert-dismissible alert-' + (this.props.type || 'warning')}>
                <button className="close" type="button" onClick={()=>this.close()}><span className="zmdi zmdi-close"></span></button>
                <div className="icon"><span className={'zmdi zmdi-' + icon}></span></div>
                {content}
            </div>
        </div>)
    }
    componentDidMount() {
        if (this.props.closeAuto == false) return
        let dTimeout = this.props.type == 'danger' ? 6000 : 3000
        setTimeout(()=>{ this.close() }, this.props.timeout || dTimeout)
    }
    close() {
        this.setState({ animatedClass: 'fadeOut' }, ()=>{
            setTimeout(()=>{
                $(this.refs['rbnotice']).parent().remove()
            }, 1000)
        })
    }
}

// ~~ 加载条
function RbSpinner(props) {
    return <div className="rb-spinner">
        <svg width="40px" height="40px" viewBox="0 0 66 66" xmlns="http://-www.w3.org/2000/svg">
            <circle fill="none" strokeWidth="4" strokeLinecap="round" cx="33" cy="33" r="30" className="circle"></circle>
        </svg>
    </div>
}

let renderRbcomp__counter = new Date().getTime()
// @jsx
// @target id or Element
const renderRbcomp = function(jsx, target) {
    target = target || ('react-comps-' + renderRbcomp__counter++)
    if ($.type(target) == 'string'){  // element id
        let container = document.getElementById(target)
        if (!container) target = $('<div id="' + target + '"></div>').appendTo(document.body)[0]
        else target = container
    } else {
        // Element object
    }
    return ReactDOM.render(jsx, target);
}

// -- Usage

let rb = rb || {}

rb.__currentModal
rb.__currentModalCache = {}
rb.modal = function(url, title, ext) {
    ext = ext || {}
    if (ext.destroyOnHide !== true) ext.destroyOnHide = false  // default false
    if (ext.destroyOnHide === false && !!rb.__currentModalCache[url]) {
        rb.__currentModal = rb.__currentModalCache[url]
        rb.__currentModal.show()
        return rb.__currentModal
    } else {
        rb.__currentModal = renderRbcomp(<RbModal url={url} title={title} width={ext.width} destroyOnHide={ext.destroyOnHide === false ? false : true } />)
        if (ext.destroyOnHide === false) rb.__currentModalCache[url] = rb.__currentModal
        return rb.__currentModal
    }
}
rb.modalHide = function(url){
    if (url){
        let m = rb.__currentModalCache[url]
        if (m) m.hide()
        else console.warn('No Modal found by url-key : ' + url)
    } else if (rb.__currentModal) {
        rb.__currentModal.hide()
    }
}
rb.modalResize = function(url){
    if (url){
        let m = rb.__currentModalCache[url]
        if (m) m.resize()
        else console.warn('No Modal found by url-key : ' + url)
    } else if (rb.__currentModal){
        rb.__currentModal.resize()
    }
}

rb.alert = function(message, title_ext, ext){
    let title = title_ext
    if ($.type(title_ext) == 'object'){
        title = null
        ext = title_ext
    }
    ext = ext || {}
    if (ext.html == true) return renderRbcomp(<RbAlert htmlMessage={message} title={title} type={ext.type} confirmText={ext.confirmText} confirm={ext.confirm} />)
    else return renderRbcomp(<RbAlert message={message} title={title} type={ext.type} confirmText={ext.confirmText} confirm={ext.confirm} />)
}

rb.notice = function(message, type, ext){
    if (top != self && parent.rb && parent.rb.notice){
        parent.rb.notice(message, type, ext)
        return;
    }
    ext = ext || {}
    if (ext.html == true) return renderRbcomp(<RbNotice htmlMessage={message} type={type} timeout={ext.timeout} />)
    else return renderRbcomp(<RbNotice message={message} type={type} timeout={ext.timeout} />)
}