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

package com.rebuild.server.metadata.entityhub;

import org.junit.Test;

import com.rebuild.server.bizz.UserService;

/**
 * 
 * @author zhaofang123@gmail.com
 * @since 08/03/2018
 */
public class Entity2SchemaTest {

	@Test
	public void testCreate() throws Exception {
		new Entity2Schema(UserService.ADMIN_USER).create("测试一把", null, null);
	}
}
