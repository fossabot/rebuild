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

package com.rebuild.server.service.notification;

import com.rebuild.server.metadata.EntityHelper;
import com.rebuild.server.service.BaseService;

import cn.devezhao.persist4j.PersistManagerFactory;
import cn.devezhao.persist4j.Record;

/**
 * 通知/消息 服务
 * 
 * @author devezhao
 * @since 10/17/2018
 */
public class NotificationService extends BaseService {

	public NotificationService(PersistManagerFactory aPMFactory) {
		super(aPMFactory);
	}
	
	/**
	 * 发送消息
	 * 
	 * @param message
	 */
	public void send(Message message) {
		Record record = EntityHelper.forNew(EntityHelper.Notification, message.getFromUser());
		record.setID("fromUser", message.getFromUser());
		record.setID("toUser", message.getToUser());
		record.setString("message", message.getMessage());
		if (message.getRelatedRecord() != null) {
			record.setID("relatedRecord", message.getRelatedRecord());
		}
		create(record);
	}
}
