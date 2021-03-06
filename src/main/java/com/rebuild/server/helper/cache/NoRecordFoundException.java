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

package com.rebuild.server.helper.cache;

import com.rebuild.server.RebuildException;

/**
 * 无效记录
 * 
 * @author devezhao
 * @since 11/23/2018
 */
public class NoRecordFoundException extends RebuildException {
	private static final long serialVersionUID = -427919151949591616L;

	public NoRecordFoundException() {
		super();
	}

	public NoRecordFoundException(String msg, Throwable cause) {
		super(msg, cause);
	}

	public NoRecordFoundException(String msg) {
		super(msg);
	}

	public NoRecordFoundException(Throwable cause) {
		super(cause);
	}
}
