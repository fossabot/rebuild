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

package com.rebuild.server.helper;

/**
 * 系统配置项
 * 
 * @author devezhao
 * @since 12/25/2018
 */
public enum SystemItem {

	// 通用
	AppName, LOGO, LOGOWhite, HomeURL, OpenSignUp,
	
	// 临时目录
	TempDirectory,
	
	// 云存储
	StorageURL, StorageApiKey, StorageApiSecret, StorageBucket,
	
	// 缓存服务
	CacheHost, CachePort, CacheUser, CachePassword,
	
	// 邮件
	MailUser, MailPassword, MailAddr, MailName,
	
	// 短信
	SmsUser, SmsPassword, SmsSign
			
}
