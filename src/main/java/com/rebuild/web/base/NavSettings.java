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

package com.rebuild.web.base;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import com.alibaba.fastjson.JSON;
import com.rebuild.server.Application;
import com.rebuild.server.helper.manager.LayoutManager;
import com.rebuild.server.helper.manager.NavManager;
import com.rebuild.server.metadata.EntityHelper;
import com.rebuild.web.BaseControll;
import com.rebuild.web.LayoutConfig;

import cn.devezhao.commons.web.ServletUtils;
import cn.devezhao.persist4j.Record;
import cn.devezhao.persist4j.engine.ID;

/**
 * 导航菜单设置
 * 
 * @author zhaofang123@gmail.com
 * @since 09/19/2018
 */
@Controller
@RequestMapping("/app/settings/")
public class NavSettings extends BaseControll implements LayoutConfig {
	
	@Override
	public void sets(String entity, HttpServletRequest request, HttpServletResponse response) throws IOException { }
	@Override
	public void gets(String entity, HttpServletRequest request, HttpServletResponse response) throws IOException { }
	
	@RequestMapping(value = "nav-settings", method = RequestMethod.POST)
	public void sets(HttpServletRequest request, HttpServletResponse response) throws IOException {
		ID user = getRequestUser(request);
		
		boolean toAll = "true".equals(getParameter(request, "toAll"));
		// 非管理员只能设置自己
		boolean isAdmin = Application.getUserStore().getUser(user).isAdmin();
		if (!isAdmin) {
			toAll = false;
		}
		
		JSON config = ServletUtils.getRequestJson(request);
		ID cfgid = getIdParameter(request, "cfgid");
		ID cfgidDetected = NavManager.detectConfigId(cfgid, toAll, user);
		
		Record record = null;
		if (cfgidDetected == null) {
			record = EntityHelper.forNew(EntityHelper.LayoutConfig, user);
			record.setString("belongEntity", "N");
			record.setString("type", LayoutManager.TYPE_NAVI);
			record.setString("applyTo", toAll ? LayoutManager.APPLY_ALL : LayoutManager.APPLY_SELF);
		} else {
			record = EntityHelper.forUpdate(cfgidDetected, user);
		}
		record.setString("config", config.toJSONString());
		Application.getCommonService().createOrUpdate(record);
		
		writeSuccess(response);
	}
	
	@RequestMapping(value = "nav-settings", method = RequestMethod.GET)
	public void gets(HttpServletRequest request, HttpServletResponse response) throws IOException {
		JSON config = NavManager.getNav(getRequestUser(request));
		writeSuccess(response, config);
	}
}
