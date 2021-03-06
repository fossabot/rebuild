class BaseChart extends React.Component {
    constructor(props) {
        super(props)
        this.state = { ...props }
    }
    render() {
        return (<div className="chart-box" ref="box">
            <div className="chart-head">
                <div className="chart-title text-truncate">{this.state.title}</div>
                <div className="chart-oper">
                    <a onClick={()=>this.loadChartData()}><i className="zmdi zmdi-refresh"/></a>
                    <a href={'chart-design?id=' + this.props.id}><i className="zmdi zmdi-edit"/></a>
                    <a onClick={()=>this.remove()}><i className="zmdi zmdi-delete"/></a>
                </div>
            </div>
            <div ref="body" className={'chart-body rb-loading ' + (!!!this.state.chartdata && ' rb-loading-active')}>{this.state.chartdata || <RbSpinner />}</div>
        </div>)
    }
    componentDidMount() {
        this.loadChartData()
    }
    componentWillUnmount(){
        if (this.__echarts) this.__echarts.dispose()
    }
    loadChartData() {
        this.setState({ chartdata: null })
        let url = !!this.state.id ? ('/dashboard/chart-data?id=' + this.state.id) : '/dashboard/chart-preview' 
        let that = this
        $.post(rb.baseUrl + url, JSON.stringify(this.state.config || {}), (res)=>{
            if (res.error_code == 0) that.renderChart(res.data)
            else that.renderError(res.error_msg)
        })
    }
    resize() {
        if (this.__echarts) this.__echarts.resize()
    }
    remove() {
        if (!window.gridster) return  // Not in dash
        let that = this
        rb.alert('确认移除此图表？', { confirm: function(){
            let $w = $(that.refs['box']).parent().parent()
            gridster.remove_widget($w)
            save_dashboard()
            this.hide()
        }})
    }
    
    renderError(msg) {
        this.setState({ chartdata: (<h4 className="chart-undata must-center">{msg || '图表加载失败'}</h4>) })
    }
    renderChart(data) {
        this.setState({ chartdata: (<div>{JSON.stringify(data)}</div>) })
    }
}

// 指标卡
class ChartIndex extends BaseChart {
    constructor(props) {
        super(props)
        this.label = this.state.title
        this.state.title = null
    }
    renderChart(data) {
        let chartdata = (<div className="chart index">
            <div className="data-item must-center text-truncate">
                <p>{data.index.label || this.label}</p>
                <strong>{data.index.data}</strong>
            </div>
        </div>)
        this.setState({ chartdata: chartdata })
    }
}

// 表格
class ChartTable extends BaseChart {
    constructor(props) {
         super(props)
    }
    renderChart(data) {
        let chartdata = (<div className="chart ctable">
            <div dangerouslySetInnerHTML={{ __html: data.html }}></div>
        </div>)
        
        let that = this
        let colLast = null
        this.setState({ chartdata: chartdata }, ()=>{
            let ct = $(that.refs['body'])
            ct.find('.ctable').css('height', ct.height() - 20)
                .perfectScrollbar()
            
            let cols = ct.find('tbody td').click(function(){
                if (colLast == this){
                    $(this).toggleClass('clk')
                    return
                }
                colLast = this
                cols.removeClass('clk')
                $(this).addClass('clk')
            })
            that.__ctable = ct
        })
    }
    resize() {
        let ct = this.__ctable
        if (ct) ct.find('.ctable').css('height', ct.height() - 20)
    }
}

// for ECharts
const ECHART_OPT = {
    grid: { left: 60, right: 30, top: 30, bottom: 30 },
    animation: false,
    tooltip: {
        trigger: 'item',
        formatter: '{a} <br/> {b} : {c} ({d}%)',
        textStyle: {
            fontSize: 12, lineHeight: 1.3, color: '#333'
        },
        axisPointer: {
            lineStyle: { color: '#ddd' }
        },
        backgroundColor: '#fff',
        extraCssText: 'border-radius:0;box-shadow:0 0 6px 0 rgba(0, 0, 0, .1), 0 8px 10px 0 rgba(170, 182, 206, .2);'
    },
    textStyle: {
        fontFamily: 'Roboto, "Hiragina Sans GB", San Francisco, "Helvetica Neue", Helvetica, Arial, PingFangSC-Light, "WenQuanYi Micro Hei", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    }
}
// 
const ECHART_AxisLabel = {
    textStyle: {
        color: '#555',
        fontSize: 12,
        fontWeight: '400'
    }
}

// 折线图
class ChartLine extends BaseChart {
    constructor(props) {
        super(props)
    }
    renderChart(data) {
        if (this.__echarts) this.__echarts.dispose()
        let that = this
        let elid = 'echarts-line-' + (this.state.id || 'id')
        this.setState({ chartdata: (<div className="chart line" id={elid}></div>) }, ()=>{
            let formatter = []
            for (let i = 0; i < data.yyyAxis.length; i++){
                let yAxis = data.yyyAxis[i]
                yAxis.type = 'line'
                yAxis.smooth = true
                yAxis.lineStyle = { width: 3 }
                yAxis.itemStyle = {
                    normal: { borderWidth: 1 },
                    emphasis: { borderWidth: 4 }
                }
                data.yyyAxis[i] = yAxis
                formatter.push('{a' + i + '} : {c' + i + '}');
            }
            
            let opt = {
                xAxis: {
                    type: 'category',
                    data: data.xAxis,
                    axisLabel: ECHART_AxisLabel,
                    axisLine: {
                        lineStyle: { color: '#ddd' }
                    }
                },
                yAxis: {
                    type: 'value',
                    splitLine: { show: false },
                    axisLabel: ECHART_AxisLabel,
                    axisLine: {
                        lineStyle: { color: '#ddd', width: 0 }
                    }
                },
                series: data.yyyAxis
            }
            opt = { ...opt, ...ECHART_OPT }
            opt.tooltip.formatter = '<b>{b}</b> <br> ' + formatter.join(' <br> ')
            opt.tooltip.trigger = 'axis'
            
            let c = echarts.init(document.getElementById(elid), 'light')
            c.setOption(opt)
            that.__echarts = c
        })
    }
}

// 柱状图
class ChartBar extends BaseChart {
    constructor(props) {
        super(props)
    }
    renderChart(data) {
        if (this.__echarts) this.__echarts.dispose()
        let that = this
        let elid = 'echarts-bar-' + (this.state.id || 'id')
        this.setState({ chartdata: (<div className="chart bar" id={elid}></div>) }, ()=>{
            let formatter = []
            for (let i = 0; i < data.yyyAxis.length; i++){
                let yAxis = data.yyyAxis[i]
                yAxis.type = 'bar'
                yAxis.smooth = true
                yAxis.lineStyle = { width: 3 }
                yAxis.itemStyle = {
                    normal: { borderWidth: 1 },
                    emphasis: { borderWidth: 4 }
                }
                data.yyyAxis[i] = yAxis
                formatter.push('{a' + i + '} : {c' + i + '}');
            }
            
            let opt = {
                xAxis: {
                    type: 'category',
                    data: data.xAxis,
                    axisLabel: ECHART_AxisLabel,
                    axisLine: {
                        lineStyle: { color: '#ddd' }
                    }
                },
                yAxis: {
                    type: 'value',
                    splitLine: { show: false },
                    axisLabel: ECHART_AxisLabel,
                    axisLine: {
                        lineStyle: { color: '#ddd', width: 0 }
                    }
                },
                series: data.yyyAxis
            }
            opt = { ...opt, ...ECHART_OPT }
            opt.tooltip.formatter = '<b>{b}</b> <br> ' + formatter.join(' <br> ')
            opt.tooltip.trigger = 'axis'
            
            let c = echarts.init(document.getElementById(elid), 'light')
            c.setOption(opt)
            that.__echarts = c
        })
    }
}

// 饼图
class ChartPie extends BaseChart {
    constructor(props) {
        super(props)
    }
    renderChart(data) {
        if (this.__echarts) this.__echarts.dispose()
        let that = this
        let elid = 'echarts-pie-' + (this.state.id || 'id')
        this.setState({ chartdata: (<div className="chart pie" id={elid}></div>) }, ()=>{
            data = { ...data, type: 'pie', radius: '71%' }
            let opt = {
                series: [ data ]
            }
            opt = { ...opt, ...ECHART_OPT }
            opt.tooltip.formatter = '<b>{b}</b> <br/> {a} : {c} ({d}%)'
            opt.tooltip.trigger = 'item'
                
            let c = echarts.init(document.getElementById(elid), 'light')
            c.setOption(opt)
            that.__echarts = c
        })
    }
}

// 漏斗圖
class ChartFunnel extends BaseChart {
    constructor(props) {
        super(props)
    }
}

// 确定图表类型
const detectChart = function(cfg, id){
    let props = { config: cfg, id: id, title: cfg.title }
    if (cfg.type == 'INDEX'){
        return <ChartIndex { ...props } />
    } else if (cfg.type == 'TABLE'){
        return <ChartTable { ...props } />
    } else if (cfg.type == 'LINE'){
        return <ChartLine { ...props } />
    } else if (cfg.type == 'BAR'){
        return <ChartBar { ...props } />
    } else if (cfg.type == 'PIE'){
        return <ChartPie { ...props } />
    } else if (cfg.type == 'FUNNEL'){
        return <ChartFunnel { ...props } />
    }
}