// ~~ 数据列表
class RbList extends React.Component {
    constructor(props) {
        super(props)
        
        this.__defaultFilterKey = 'AdvFilter-' + this.props.config.entity
        this.__sortFieldKey = 'SortField-' + this.props.config.entity
        this.__columnWidthKey = 'ColumnWidth-' + this.props.config.entity + '.'
        
        let sort = ($storage.get(this.__sortFieldKey) || ':').split(':')
        let fields = props.config.fields
        for (let i = 0; i < fields.length; i++){
            let cw = $storage.get(this.__columnWidthKey + fields[i].field)
            if (!!cw && ~~cw >= 48) fields[i].width = ~~cw
            if (sort[0] == fields[i].field) fields[i].sort = sort[1]
        }
        props.config.fields = null
        this.state = { ...props, fields: fields, rowsData: [], noData: false, checkedAll: false, pageNo: 1, pageSize: 20 }
        
        this.__defaultColumnWidth = $('#react-list').width() / 10
        if (this.__defaultColumnWidth < 130) this.__defaultColumnWidth = 130
        
        this.pageNo = 1
        this.pageSize = $storage.get('ListPageSize') || 20
        this.advFilter = $storage.get(this.__defaultFilterKey)
        
        this.toggleAllRow = this.toggleAllRow.bind(this)
    }
    render() {
        let that = this;
        const lastIndex = this.state.fields.length
        return (
        <div>
            <div className="row rb-datatable-body">
            <div className="col-sm-12">
                <div className="rb-scroller" ref="rblist-scroller">
                    <table className="table table-hover table-striped">
                    <thead>
                        <tr>
                            <th className="column-checkbox">
                                <div><label className="custom-control custom-control-sm custom-checkbox"><input className="custom-control-input" type="checkbox" checked={this.state.checkedAll} onClick={this.toggleAllRow} /><span className="custom-control-label"></span></label></div>
                            </th>
                            {this.state.fields.map((item, index) =>{
                                let cWidth = (item.width || that.__defaultColumnWidth)
                                let styles = { width: cWidth + 'px' }
                                let sortClazz = item.sort || ''
                                return (<th key={'column-' + item.field} style={styles} className="sortable unselect" onClick={this.sortField.bind(this, item.field)}><div style={styles}><span style={{ width: (cWidth-8) + 'px' }}>{item.label}</span><i className={'zmdi ' + sortClazz}></i><i className="split" data-field={item.field}></i></div></th>)
                            })}
                            <th className="column-empty"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.rowsData.map((item, index) => {
                            let lastGhost = item[lastIndex]
                            let rowKey = 'row-' + lastGhost[0]
                            return (<tr key={rowKey} className={lastGhost[3] ? 'table-active' : ''} onClick={this.clickRow.bind(this, index, false)}>
                                <td key={rowKey + '-checkbox'} className="column-checkbox">
                                    <div><label className="custom-control custom-control-sm custom-checkbox"><input className="custom-control-input" type="checkbox" checked={lastGhost[3]} onClick={this.clickRow.bind(this, index, true)} /><span className="custom-control-label"></span></label></div>
                                </td>
                                {item.map((cell, index) => {
                                    return that.renderCell(cell, index, lastGhost)
                                })}
                                <td className="column-empty"></td>
                            </tr>)
                        })}    
                    </tbody>
                    </table>
                    {this.state.noData == true ? <div className="list-nodata"><span className="zmdi zmdi-info-outline"/><p>没有检索到数据</p></div> : null}
                </div>
            </div></div>
            {this.state.rowsTotal && <RbListPagination rowsTotal={this.state.rowsTotal} pageSize={this.pageSize} $$$parent={this} />}
        </div>)
    }
    componentDidMount() {
        const scroller = $(this.refs['rblist-scroller'])
        scroller.perfectScrollbar()
        
        let that = this
        scroller.find('th .split').draggable({ containment: '.rb-datatable-body', axis: 'x', helper: 'clone', stop: function(event, ui){
            let field = $(event.target).data('field')
            let left = ui.position.left - 2
            if (left < 48) left = 48  // min
            let fields = that.state.fields
            for (let i = 0; i < fields.length; i++){
                if (fields[i].field == field){
                    fields[i].width = left
                    $storage.set(that.__columnWidthKey + field, left)
                    break
                }
            }
            that.setState({ fields: fields })
        }})
        this.fetchList()
    }
    componentDidUpdate() {
        let that = this
        this.__selectedRows = []
        this.state.rowsData.forEach((item) => {
            let lastGhost = item[that.state.fields.length]
            if (lastGhost[3] == true) that.__selectedRows.push(lastGhost)
        })
        
        let oper = $('.dataTables_oper')
        oper.find('.J_delete, .J_view, .J_edit').attr('disabled', true)
        let len = this.__selectedRows.length
        if (len > 0) oper.find('.J_delete').attr('disabled', false)
        if (len == 1) oper.find('.J_view, .J_edit').attr('disabled', false)
    }
    
    fetchList(filter) {
        let fields = []
        let field_sort = null
        this.state.fields.forEach(function(item){
            fields.push(item.field)
            if (!!item.sort) field_sort = item.field + ':' + item.sort.replace('sort-', '')
        })
        
        let entity = this.props.config.entity
        this.lastFilter = filter || this.lastFilter
        let query = {
            entity: entity,
            fields: fields,
            pageNo: this.pageNo,
            pageSize: this.pageSize,
            filter: this.lastFilter,
            advFilter: this.advFilter,
            sort: field_sort,
            reload: this.pageNo == 1
        }
        
        let that = this
        $('#react-list').addClass('rb-loading-active')
        $.post(`${rb.baseUrl}/app/${entity}/data-list`, JSON.stringify(query), function(res){
            if (res.error_code == 0){
                let rowsdata = res.data.data || []
                if (rowsdata.length > 0) {
                    let lastIndex = rowsdata[0].length - 1
                    rowsdata = rowsdata.map((item) => {
                        item[lastIndex][3] = false  // Checked?
                        return item
                    })
                }
                
                let state = { noData: rowsdata.length == 0, rowsData: rowsdata }
                if (res.data.total > 0) state.rowsTotal = res.data.total
                that.setState(state)
                
            }else{
                rb.notice(res.error_msg || '加载失败，请稍后重试', 'danger')
            }
            $('#react-list').removeClass('rb-loading-active')
        })
    }
    
    // 渲染表格及相关事件处理
    
    renderCell(cellVal, index, lastGhost) {
        if (this.state.fields.length == index) return null
        
        const cellKey = 'row-' + lastGhost[0] + '-' + index
        if (!!!cellVal) return <td key={cellKey}><div></div></td>
       
        const field = this.state.fields[index]
        let styles = { width: (this.state.fields[index].width || this.__defaultColumnWidth) + 'px' }
        if (field.type == 'IMAGE') {
            cellVal = JSON.parse(cellVal || '[]')
            return (<td key={cellKey}><div style={styles} className="column-imgs">
                {cellVal.map((item, idx)=>{
                    let imgName = __fileCutName(item)
                    return <a key={cellKey + idx} href={'#!/Preview/' + item} title={imgName}><img src={rb.storageUrl + item + '?imageView2/2/w/100/interlace/1/q/100'} /></a>
                })}</div></td>)
        } else if (field.type == 'FILE') {
            cellVal = JSON.parse(cellVal || '[]')
            return (<td key={cellKey}><div style={styles} className="column-files"><ul className="list-unstyled">
                {cellVal.map((item, idx)=>{
                    let fileName = __fileCutName(item)
                    return <li key={cellKey + idx} className="text-truncate"><a href={'#!/Preview/' + item} title={fileName}>{fileName}</a></li>
                })}</ul></div></td>)
        } else if (field.type == 'REFERENCE'){
            return <td key={cellKey}><div style={styles}><a href={'#!/View/' + cellVal[2][0] + '/' + cellVal[0]} onClick={() => this.clickView(cellVal)}>{cellVal[1]}</a></div></td>
        } else if (field.field == this.props.config.nameField){
            cellVal = lastGhost
            return <td key={cellKey}><div style={styles}><a href={'#!/View/' + cellVal[2][0] + '/' + cellVal[0]} onClick={() => this.clickView(cellVal)} className="column-main">{cellVal[1]}</a></div></td>
        } else if (field.type == 'URL') {
            return <td key={cellKey}><div style={styles}><a href={rb.baseUrl + '/common/url-safe?url=' + encodeURIComponent(cellVal)} className="column-url" target="_blank">{cellVal}</a></div></td>
        } else if (field.type == 'EMAIL') {
            return <td key={cellKey}><div style={styles}><a href={'mailto:' + cellVal} className="column-url">{cellVal}</a></div></td>
        } else {
            return <td key={cellKey}><div style={styles}>{cellVal}</div></td>
        }
    }
    
    toggleAllRow(e) {
        let checked = this.state.checkedAll == false
        let rowsdata = this.state.rowsData
        rowsdata = rowsdata.map((item) => {
            item[item.length - 1][3] = checked  // Checked?
            return item
        })
        this.setState({ checkedAll: checked, rowsData: rowsdata })
        return false
    }
    clickRow(rowIndex, holdOthers, e) {
        if (e.target.tagName == 'SPAN') return false
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
        
        let rowsdata = this.state.rowsData
        let lastIndex = rowsdata[0].length - 1
        if (holdOthers == true){
            let item = rowsdata[rowIndex]
            item[lastIndex][3] = item[lastIndex][3] == false  // Checked?
            rowsdata[rowIndex] = item
        } else {
            rowsdata = rowsdata.map((item, index) => {
                item[lastIndex][3] = index == rowIndex
                return item
            })
        }
        this.setState({ rowsData: rowsdata })
        return false
    }
    
    clickView(cellVal) {
        rb.RbViewModal({ id: cellVal[0], entity: cellVal[2][0] })
        return false
    }
    
    sortField(field, e) {
        let fields = this.state.fields;
        for (let i = 0; i < fields.length; i++){
            if (fields[i].field == field){
                if (fields[i].sort == 'sort-asc') fields[i].sort = 'sort-desc'
                else fields[i].sort = 'sort-asc'
                $storage.set(this.__sortFieldKey, field + ':' + fields[i].sort)
            } else {
                fields[i].sort = null
            }
        }
        let that = this
        this.setState({ fields: fields }, function(){
            that.fetchList()
        })
        
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
        return false
    }
    
    // 外部接口
    
    setPage(pageNo, pageSize) {
        this.pageNo = pageNo || this.pageNo
        if (pageSize) {
            this.pageSize = pageSize
            $storage.set('ListPageSize', pageSize)
        }
        this.fetchList()
    }
    
    setAdvFilter(id) {
        this.advFilter = id
        this.fetchList()
        
        if (!!id) $storage.set(this.__defaultFilterKey, id)
        else $storage.remove(this.__defaultFilterKey)
    }
    
    getSelectedRows() {
        return this.__selectedRows
    }
    getSelectedIds() {
        if (!this.__selectedRows || this.__selectedRows.length < 1) { rb.notice('未选中任何记录'); return [] }
        let ids = this.__selectedRows.map((item) => { return item[0] })
        return ids
    }
    
    search(filter) {
        this.fetchList(filter)
    }
    reload() {
        this.fetchList()
    }
}

// 分页组件
class RbListPagination extends React.Component {
    constructor(props) {
        super(props)
        this.state = { ...props }
        
        this.state.pageNo = this.state.pageNo || 1
        this.state.pageSize = this.state.pageSize || 20
        this.state.rowsTotal = this.state.rowsTotal || 0
    }
    render() {
        this.__pageTotal = Math.ceil(this.state.rowsTotal / this.state.pageSize)
        if (this.__pageTotal <= 0) this.__pageTotal = 1
        let pages = this.__pageTotal <= 1 ? [1] : $pages(this.__pageTotal, this.state.pageNo)
        return (
            <div className="row rb-datatable-footer">
                <div className="col-sm-3">
                    <div className="dataTables_info">{this.state.rowsTotal > 0 ? `共 ${this.state.rowsTotal} 条数据` : ''}</div>
                </div>
                <div className="col-sm-9">
                    <div className="float-right paging_sizes">
                        <select className="form-control form-control-sm" title="每页显示" onChange={this.setPageSize} value={this.state.pageSize || 20}>
                            <option value="20">20 条</option>
                            <option value="40">40 条</option>
                            <option value="80">80 条</option>
                            <option value="100">100 条</option>
                            <option value="200">200 条</option>
                        </select>
                    </div>
                    <div className="float-right dataTables_paginate paging_simple_numbers">
                        <ul className="pagination">
                            {this.state.pageNo > 1 && <li className="paginate_button page-item"><a className="page-link" onClick={()=>this.prev()}><span className="icon zmdi zmdi-chevron-left"></span></a></li>}
                            {pages.map((item) => {
                                if (item == '.') return <li key={'page-' + item} className="paginate_button page-item disabled"><a className="page-link">...</a></li>
                                else return <li key={'page-' + item} className={'paginate_button page-item ' + (this.state.pageNo == item && 'active')}><a className="page-link" onClick={this.goto.bind(this, item)}>{item}</a></li>
                            })}
                            {this.state.pageNo != this.__pageTotal && <li className="paginate_button page-item"><a className="page-link" onClick={()=>this.next()}><span className="icon zmdi zmdi-chevron-right"></span></a></li>}
                        </ul>
                    </div>
                    <div className="clearfix" />
                </div>
            </div>
        )
    }
    prev() {
        if (this.state.pageNo == 1) return
        this.goto(this.state.pageNo - 1)
    }
    next() {
        if (this.state.pageNo == this.__pageTotal) return
        this.goto(this.state.pageNo + 1)
    }
    goto(pageNo) {
        this.setState({ pageNo: pageNo }, ()=>{
            this.props.$$$parent.setPage(this.state.pageNo)
        })
    }
    setPageSize = (e) => {
        let s = e.target.value
        this.setState({ pageSize: s }, ()=>{
            this.props.$$$parent.setPage(1, s)
        })
    }
}

// -- Usage

var rb = rb || {}

// @props = { config }
rb.RbList = function(props, target) {
    return renderRbcomp(<RbList {...props} />, target || 'react-list')
}

// 列表页面初始化
const RbListPage = {
    _RbList: null,
    
    // @config - List config
    // @entity - [Name, Label, Icon]
    // @ep - Privileges of this entity
    init: function(config, entity, ep) {
        this._RbList = renderRbcomp(<RbList config={config} />, 'react-list')
        
        QuickFilters.init('.input-search', entity[0]);
        
        $('.J_new').click(function(){
            rb.RbFormModal({ title: `新建${entity[1]}`, entity: entity[0], icon: entity[2] })
        })
        
        let that = this
        
        $('.J_edit').click(function(){
            let selected = that._RbList.getSelectedRows()
            if (selected.length == 1) {
                selected = selected[0]
                rb.RbFormModal({ id: selected[0], title: `编辑${entity[1]}`, entity: entity[0], icon: entity[2] })
            }
        })
        
        $('.J_delete').click(function(){
            let ids = that._RbList.getSelectedIds()
            if (ids.length < 1) return
            
            let alertExt = { type: 'danger', confirmText: '删除' }
            alertExt.confirm = function(){
                let btns = $(this.refs['rbalert']).find('.btn').button('loading')
                let thatModal = this
                $.post(rb.baseUrl + '/app/entity/record-delete?id=' + ids.join(','), function(res){
                    if (res.error_code == 0){
                        that._RbList.reload()
                        thatModal.hide()
                        if (res.data.deleted == res.data.requests) rb.notice('删除成功', 'success')
                        else rb.notice('删除了 ' + res.data.deleted + ' 条记录', 'success')
                    } else {
                        rb.notice(res.error_msg || '删除失败，请稍后重试', 'danger')
                    }
                    btns.button('reset')
                })
            }
            rb.alert('确认删除选中的 ' + ids.length + ' 条记录吗？', alertExt)
        })
        
        $('.J_view').click(function(){
            let selected = that._RbList.getSelectedRows()
            if (selected.length == 1) {
                selected = selected[0]
                rb.RbViewModal({ id: selected[0], entity: entity[0] })
            }
        })
        
        $('.J_assign').click(function(){
            let ids = that._RbList.getSelectedIds()
            if (ids.length < 1) return
            rb.DlgAssign({ entity: entity[0], ids: ids })
        })
        $('.J_share').click(function(){
            let ids = that._RbList.getSelectedIds()
            if (ids.length < 1) return
            rb.DlgShare({ entity: entity[0], ids: ids })
        })
        
        $('.J_columns').click(function(){
            window.__currentModal = rb.modal(`${rb.baseUrl}/p/general-entity/show-fields?entity=${entity[0]}`, '设置列显示')
        })
        
        // Privileges
        if (ep) {
            if (ep.C === false) $('.J_new').remove()
            if (ep.D === false) $('.J_delete').remove()
            if (ep.U === false) $('.J_edit').remove()
            if (ep.A === false) $('.J_assign').remove()
            if (ep.S === false) $('.J_share').remove()
            $cleanMenu('.J_action')
        }
    },
}

// 列表快速查询
const QuickFilters = {

    // @el - 控件
    // @entity - 实体
    init(el, entity) {
        this.root = $(el)
        this.entity = entity

        let that = this
        let btn = this.root.find('.J_search-btn').click(function(){
            let val = $val(that.root.find('.J_search-text'))
            that.fireFilter(val)
        })
        this.root.find('.J_search-text').keydown(function(event){
            if (event.which == 13) btn.trigger('click')
        })
        this.root.find('.J_qfields').click(function(event){
            rb.modal(`${rb.baseUrl}/p/general-entity/quick-fields?entity=${that.entity}`, '设置快速查询字段')
        })

        this.loadFilter()
    },
    
    loadFilter() {
        let that = this
        $.get(`${rb.baseUrl}/app/${this.entity}/advfilter/quick-gets`, function(res){
            that.filterExp = res.data || { items: [] }
            let qFields = []
            that.filterExp.items.forEach(function(item){ qFields.push(item.label) })
            that.root.find('.J_search-text').attr('placeholder', '搜索 ' + qFields.join('/'))
        })
    },
    fireFilter(val) {
        if (!this.filterExp || this.filterExp.items.length == 0){
            rb.notice('请先设置查询字段')
            return
        }
        this.filterExp.values = { 1: val }
        this.mergeFilter()
        RbListPage._RbList.search(this.filterExp)
    },
    
    // 复写增加额外过滤条件
    mergeFilter() {
    }
}

// 列表高级查询
const AdvFilters = {
        
    // @el - 控件
    // @entity - 实体
    init(el, entity) {
        this.__el = $(el)
        this.__entity = entity

        let that = this
        this.__el.find('.J_advfilter').click(()=>{ that.showAdvFilter() })
        // $ALL$
        $('.adv-search .dropdown-item:eq(0)').click(()=>{
            $('.adv-search .J_name').text('所有数据')
            RbListPage._RbList.setAdvFilter(null)
        })

        this.loadFilters()
    },
    
    loadFilters() {
        let dfilter = $storage.get(RbListPage._RbList.__defaultFilterKey)
        let that = this
        $.get(`${rb.baseUrl}/app/${this.__entity}/advfilter/list`, function(res){
            $('.adv-search .J_custom').each(function(){ $(this).remove() })
            
            $(res.data).each(function(){
                let item = $('<div class="dropdown-item J_custom" data-id="' + this[0] + '"><a class="text-truncate">' + this[1] + '</a></div>')
                $('.adv-search .dropdown-divider').before(item)
                
                let _data = this
                if (_data[2] == true){
                    let action = $('<div class="action"><a title="修改"><i class="zmdi zmdi-edit"></i></a><a title="删除"><i class="zmdi zmdi-delete"></i></a></div>').appendTo(item)
                    action.find('a:eq(0)').click(function(){
                        that.showAdvFilter(_data[0])
                        $('.adv-search .btn').dropdown('toggle')
                        return false
                    })
                    action.find('a:eq(1)').click(function(){
                        let _alert = rb.alert('确认删除此过滤项吗？', '删除确认', { confirm:()=>{
                            $.post(`${rb.baseUrl}/app/entity/advfilter/delete?id=${_data[0]}`, (res)=>{
                                if (res.error_code == 0){
                                    _alert.hide()
                                    rb.notice('过滤项已删除', 'success')
                                    that.loadFilters()
                                    
                                    if (dfilter == _data[0]) {
                                        RbListPage._RbList.setAdvFilter(null)
                                        $('.adv-search .J_name').text('所有数据')
                                    }
                                    
                                } else rb.notice(res.error_msg, 'danger')
                            })
                        } })
                        return false
                    })
                }
                item.click(function(){
                    $('.adv-search .J_name').text(_data[1])
                    RbListPage._RbList.setAdvFilter(_data[0])
                })
                
                if (dfilter == _data[0]) {
                    $('.adv-search .J_name').text(_data[1])
                }
            })
        })
    },
    
    saveFilter(filter, name, toAll) {
        if (!!!filter) return
        let that = AdvFilters
        let url = `${rb.baseUrl}/app/${that.__entity}/advfilter/post?id=${that.__cfgid || ''}`
        if (!!name)  url += '&name=' + $encode(name)
        if (toAll === true || toAll === false) url += '&toAll=' + toAll
        $.post(url, JSON.stringify(filter), function(res){
            if (res.error_code == 0){
                rb.notice('过滤项已保存', 'success')
                that.__modal.hide()
                that.loadFilters()
            } else rb.notice(res.error_msg, 'danger')
        })
    },
    
    showAdvFilter(id) {
        this.__cfgid = id
        let props = { entity: this.__entity, inModal: true, needSave: true, confirm: this.saveFilter, destroyOnHide: true }
        if (!!!id){
            this.__modal = renderRbcomp(<AdvFilter { ...props } title="添加过滤项" />)
        }else{
            let that = this
            $.get(rb.baseUrl + '/app/entity/advfilter/get?id=' + id, function(res){
                let _data = res.data
                that.__modal = renderRbcomp(<AdvFilter { ...props } title="修改过滤项" filter={_data.filter} filterName={_data.name} applyToAll={_data.applyTo == 'ALL'} />)
            })
        }
    }
}

// Init
$(document).ready(()=>{
    let wpc = window.__PageConfig
    if (!wpc) return
    RbListPage.init(wpc.listConfig, wpc.entity, wpc.privileges)
    if (!(wpc.advFilter == false)) AdvFilters.init('.adv-search', wpc.entity[0])
})