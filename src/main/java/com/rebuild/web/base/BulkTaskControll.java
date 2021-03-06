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

import com.alibaba.fastjson.JSON;
import com.rebuild.server.job.BulkTaskExecutor;
import com.rebuild.utils.JSONUtils;
import com.rebuild.web.BaseControll;

/**
 * 
 * @author devezhao
 * @since 09/29/2018
 */
@RequestMapping("/commons/task/")
@Controller
public class BulkTaskControll extends BaseControll {

	@RequestMapping("submit")
	public void submit(HttpServletRequest request, HttpServletResponse response) 
			throws IOException {
//		JSON reqdata = ServletUtils.getRequestJson(request);
//		BulkTaskExecutor.submit(task)
	}

	@RequestMapping("check-state")
	public void checkState(HttpServletRequest request, HttpServletResponse response)
			throws IOException {
		String taskid = getParameterNotNull(request, "taskid");
		double cp = BulkTaskExecutor.getTask(taskid).getCompletePercent();
		JSON ret = JSONUtils.toJSONObject(new String[] { "taskid", "complete" }, new Object[] { taskid, cp });
		writeSuccess(response, ret);
	}
}
