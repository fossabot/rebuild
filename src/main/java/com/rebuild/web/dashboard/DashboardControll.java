/*
rebuild - Building your system freely.
Copyright (C) 2018 devezhao <zhaofang123@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

package com.rebuild.web.dashboard;

import java.io.IOException;
import java.util.Iterator;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.rebuild.server.Application;
import com.rebuild.server.helper.manager.DashboardManager;
import com.rebuild.server.metadata.EntityHelper;
import com.rebuild.utils.JSONUtils;
import com.rebuild.web.BaseControll;

import cn.devezhao.commons.web.ServletUtils;
import cn.devezhao.persist4j.Record;
import cn.devezhao.persist4j.engine.ID;

/**
 * 
 * @author zhaofang123@gmail.com
 * @since 07/25/2018
 */
@Controller
@RequestMapping("/dashboard")
public class DashboardControll extends BaseControll {

	@RequestMapping("/home")
	public ModelAndView pageHome(HttpServletRequest request) {
		return createModelAndView("/dashboard/home.jsp");
	}
	
	@RequestMapping("/dash-gets")
	public void dashGets(HttpServletRequest request, HttpServletResponse response) throws IOException {
		ID user = getRequestUser(request);
		JSON dashs = DashboardManager.getDashList(user);
		writeSuccess(response, dashs);
	}
	
	@RequestMapping("/chart-gets")
	public void chartGets(HttpServletRequest request, HttpServletResponse response) throws IOException {
		ID user = getRequestUser(request);
		JSON dashs = DashboardManager.getChartList(user);
		writeSuccess(response, dashs);
	}
	
	@RequestMapping("/dash-update")
	public void dashUpdate(HttpServletRequest request, HttpServletResponse response) throws IOException {
		ID user = getRequestUser(request);
		JSON formJson = ServletUtils.getRequestJson(request);
		Record record = EntityHelper.parse((JSONObject) formJson, user);
		
		if (!DashboardManager.allowedUpdate(user, record.getPrimary())) {
			writeFailure(response, "无权修改他人的仪表盘");
			return;
		}
		
		Application.getCommonService().update(record);
		writeSuccess(response);
	}
	
	@RequestMapping("/dash-new")
	public void dashNew(HttpServletRequest request, HttpServletResponse response) throws IOException {
		ID user = getRequestUser(request);
		JSONObject formJson = (JSONObject) ServletUtils.getRequestJson(request);
		JSONArray dashCopy = formJson.getJSONArray("__copy");
		if (dashCopy != null) {
			formJson.remove("__copy");
		}
		formJson.put("config", JSONUtils.EMPTY_ARRAY_STR);
		
		Record dashRecord = EntityHelper.parse((JSONObject) formJson, user);
		
		// 复制当前面板
		if (dashCopy != null) {
			for (Object o : dashCopy) {
				JSONObject item = (JSONObject) o;
				String chartId = item.getString("chart");
				Record chart = Application.createQueryNoFilter(
						"select belongEntity,type,title,config,createdBy from ChartConfig where chartId = ?")
						.setParameter(1, ID.valueOf(chartId))
						.record();
				// 自己的直接使用
				if (user.equals(chart.getID("createdBy"))) {
					continue;
				}
				
				chart.removeValue("createdBy");
				Record chartRecord = EntityHelper.forNew(EntityHelper.ChartConfig, user);
				for (Iterator<String> iter = chart.getAvailableFieldIterator(); iter.hasNext(); ) {
					String field = iter.next();
					chartRecord.setObjectValue(field, chart.getObjectValue(field));
				}
				chartRecord = Application.getCommonService().create(chartRecord);
				item.put("chart", chartRecord.getPrimary().toLiteral());
			}
			dashRecord.setString("config", dashCopy.toJSONString());
		}
		
		dashRecord = Application.getCommonService().create(dashRecord);
		
		JSON ret = JSONUtils.toJSONObject("id", dashRecord.getPrimary().toLiteral());
		writeSuccess(response, ret);
	}
	
	@RequestMapping("/dash-config")
	public void dashConfig(HttpServletRequest request, HttpServletResponse response) throws IOException {
		ID dashid = getIdParameterNotNull(request, "id");
		ID user = getRequestUser(request);
		
		if (!DashboardManager.allowedUpdate(user, dashid)) {
			writeFailure(response, "无权修改他人的仪表盘");
			return;
		}
		
		JSON config = ServletUtils.getRequestJson(request);
		Record record = EntityHelper.forUpdate(dashid, user);
		record.setString("config", config.toJSONString());
		Application.getCommonService().update(record);
		writeSuccess(response);
	}
}
