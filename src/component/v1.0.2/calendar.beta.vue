<template>
<transition name="slide">
    <div v-show="display" class="vc-calendar-root">
        <!-- calendar-mask -->
        <div class="vc-calendar-mask" @click="hide">{{scrollTop}}延迟加载月份{{countNumber}}:已加载月份{{countNumbered}}</div>
        <!-- calendar-section -->
        <div class="vc-calendar-section">
            <!-- 公用星期标题 -->
            <ul v-if="publicWeek" class="vc-calendar-public-title">
                <li v-for="(pItem, pIndex) in 7" :key="pIndex">{{!!i18n && i18n.weekdaysShort[(week+pIndex)%7]}}</li>
            </ul>
            <!-- 日历列表 -->
            <div class="vc-calendar" :class="{'vc-calendar-top': !publicWeek }" :scrollTop.prop="scrollTop" @scroll.passive="onScroll">
                <!-- 每月列表 -->
                <div class="vc-calendar-month" v-for="(item, index) in calendars" :key="index" :id="getAnchor(item.date)">
                    <!-- 每月标题 -->
                    <h1 class="vc-calendar-month-title">{{item.date.format(format)}}</h1>
                    <ul v-if="item.type === 1" class="vc-calendar-day">
                        <template v-if="!publicWeek">
                            <li v-for="(pwItem, pwIndex) in 7" class="vc-calendar-week-item" :key="`pw-${pwIndex}`">{{!!i18n && i18n.weekdaysShort[(week+pwIndex)%7]}}</li>
                        </template>
                        <template v-for="(dayItem, dayIndex) in item.data">
                            <!-- 有效 -->
                            <li v-if="dayItem.isAvailable" class="vc-calendar-day-item" :key="dayIndex" :class="createClass(dayItem)" @click="select(dayItem.date)">{{dayItem.day}}</li>
                            <!-- 无效 -->
                            <li v-else-if="dayItem.type === 0" class="vc-calendar-day-item unavailable" :key="dayIndex">{{ dayItem.type === 0 ? dayItem.day : ''}}</li>
                            <!-- 上下月 -->
                            <li v-else class="vc-calendar-day-item" :class="{'unavailable':dayItem.type != 0 && showPrevNextDate}" :key="dayIndex">{{ dayItem.type != 0 && showPrevNextDate ? dayItem.day : ''}}</li>
                        </template>
                    </ul>
                    <!-- 等待加载状态 -->
                    <div v-else="item.type === -1" class="vc-calendar-month-unload">
                        <h1>{{item.date.getMonth()+1}}</h1>
                        <div class="typing_loader_section">
                            <div class="typing_loader"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</transition>
</template>
<script>
// 格式化
Date.prototype.format = function(format) {
    //默认标准格式
    var date = this;
    format = format || 'yyyy-MM-dd';
    var obj = {
        'Y': date.getFullYear(), // 年份，注意必须用getFullYear
        'y': date.getFullYear(), // 年份，注意必须用getFullYear
        'M': date.getMonth() + 1, // 月份，注意是从0-11
        'd': date.getDate(), // 日期
        'q': Math.floor((date.getMonth() + 3) / 3), // 季度
        'w': date.getDay(), // 星期，注意是0-6
        'H': date.getHours(), // 24小时制
        'h': date.getHours() % 12 == 0 ? 12 : date.getHours() % 12, // 12小时制
        'm': date.getMinutes(), // 分钟
        's': date.getSeconds(), // 秒
        'S': date.getMilliseconds() // 毫秒
    };
    var week = ['天', '一', '二', '三', '四', '五', '六'];
    for (var i in obj) {
        format = format.replace(new RegExp(i + '+', 'g'), function(m) {
            var val = obj[i] + '';
            if (i == 'w') return (m.length > 2 ? '星期' : '周') + week[val];
            for (var j = 0, len = val.length; j < m.length - len; j++) val = '0' + val;
            return m.length == 1 ? val : val.substring(val.length - m.length);
        });
    }
    return format;
};

export default {
    name: "Calendar",
    data: () => ({
        display: false,
        tag: Math.random().toString(36).substr(9),
        scrollTop: 0,
        calendars: [],
        range: [],
        renderRange: [], //当前渲染区间 记录当前已经渲染的区间
        i18n: null,
        publicWeek: null,
        // 默认配置
        opt: {
            showPrevNextDate: false, //上下月是否展示
            minDate: new Date(1970, 0, 1), //最小从1970-01-01开始
            maxDate: null,
            week: 0, //一周星期几开始 0-7[星期日-星期一]
            language: 'zh',
            view: 2,
            publicWeek: true, //公用周标题
            format: "YYYY年MM月",
            cache: 2, //缓存月份
            viewHeight : 235,
        },
        // 文案
        copywriter: {
            'zh': {
                weekdaysShort: ['日', '一', '二', '三', '四', '五', '六']
            },
            'en': {
                weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            }
        },
        // 测试
        countNumber : 0,
        countNumbered : 0,

    }),
    methods: {
        init(option) {
            // 初始化
            const {
                copywriter,
                opt,
                isType,
                clearTime,
                getTimeOfclearTime,
                getIntervalMonth,
                getDateOfclearDateTime
            } = this;
            // merge 配置
            const config = { ...opt,
                ...option
            };
            // 这时候拿到的config并不一定全是正确配置
            this.minDateTime = getTimeOfclearTime(config.minDate);
            this.maxDateTime = getTimeOfclearTime(config.maxDate);
            this.minDateOfclearDateTime = getDateOfclearDateTime(config.minDate); //去除天数(设置为1)、时间的日期对象
            this.maxDateOfclearDateTime = getDateOfclearDateTime(config.maxDate); //去除天数(设置为1)、时间的日期对象
            this.i18n = copywriter[config.language];
            this.fixDate = getDateOfclearDateTime();
            this.week = /^[0-6]$/g.test(config.week) ? opt.week : 0;
            this.view = config.view; //插件默认渲染多少月份[其他月份按需加载计算]
            this.cache = config.cache; //缓存月份
            this.publicWeek = !!config.publicWeek;
            this.showPrevNextDate = !!config.showPrevNextDate;
            this.format = config.format;
            this.countMonth = getIntervalMonth(config.minDate, config.maxDate);
            this.viewHeight = config.viewHeight;
        },
        /*====test===*/
        getIntervalMonth(startDate, endDate) {
            const startMonth = startDate.getMonth();
            const endMonth = endDate.getMonth();
            return Math.abs((startDate.getFullYear() * 12 + startMonth) - (endDate.getFullYear() * 12 + endMonth)) + 1;
        },
        /*====test===*/
        onScroll(e) {
            const scrollTop = e.target.scrollTop;
            const {
                view,
                cache,
                viewHeight,
                renderRange,
                getAnchor
            } = this;
            /*===重构滚动===*/
            if (scrollTop > this.scrollTop) {
                //内容向上滚动
                const {date : _date, index : _index} = renderRange[1];
                const dom = document.getElementById(getAnchor(_date));
                const offsetTop = !!dom ? dom.offsetTop : null;
                const index = _index+ 1;
                const {date , type}  = this.calendars[index] || {};
                if((scrollTop + viewHeight*(view+cache)) > offsetTop && !!type && type === -1){
                    this.countNumber +=1;
                    this.renderRange[1] = {date, index};
                    // 这里闭包异步解决 计算日历慢的问题
                    ((_this, date, index)=>{
                        setTimeout(()=>{
                            _this.calendars[index].data = _this.createCalendarsOfView(date);
                            _this.calendars[index].type = 1;
                            this.countNumbered +=1;
                        }, 10);
                    })(this, date, index);
                }
            } else {
                //内容向下滚动
                const {date : _date, index : _index} = renderRange[0];
                const dom = document.getElementById(getAnchor(_date));
                const offsetTop = !!dom ? dom.offsetTop : null;
                const index = _index-1;
                const {date , type}  = this.calendars[index] || {};
                if((scrollTop - viewHeight*(view+cache-1)) < offsetTop && !!type && type === -1){
                    this.countNumber +=1;
                    this.renderRange[0] = {date, index};
                    // 这里闭包异步解决 计算日历慢的问题
                    ((_this, date, index)=>{
                        setTimeout(()=>{
                            _this.calendars[index].data = _this.createCalendarsOfView(date);
                            _this.calendars[index].type = 1;
                            this.countNumbered +=1;
                        }, 10);
                    })(this, date, index);
                }
            }
            this.scrollTop = scrollTop;

            return;
            /*===重构滚动===*/
            const currentScrollTop = e.target.scrollTop;
            if (currentScrollTop > this.scrollTop) {
                // 向下滚动
                const endRangeDate = this.renderRange[1];
                const dom = document.getElementById(this.getAnchor(endRangeDate));
                const lastOffsetTop = dom.offsetTop;
                const index = dom.getAttribute('data-index');
                const item = this.calendars[index * 1 + 1];
                // console.log( item.date );
                if (currentScrollTop + 275 * 3 > lastOffsetTop && !!item && item.loadType == -1) {
                    // 未加载
                    // item.loadType = 0;
                    this.renderRange[1] = item.date;
                    // item.data = this.33,150,243(item.date).data;
                    // 这里闭包异步解决 计算日历慢的问题
                    (function(_this, _item) {
                        setTimeout(() => {
                            _item.data = _this.createCalendarsOfView(_item.date).data;
                        }, 0);
                    })(this, item);
                    item.loadType = 1;
                    // this.calendars[index*1+1] = this.createCalendarsOfView(item.date);
                }
            } else {
                // 向上滚动
                const startRangeDate = this.renderRange[0];
                const dom = document.getElementById(this.getAnchor(startRangeDate));
                const lastOffsetTop = dom.offsetTop;
                const index = dom.getAttribute('data-index');
                const item = this.calendars[index * 1 - 1];
                // console.log( item.date );
                if (currentScrollTop - lastOffsetTop < 275 && !!item && item.loadType == -1) {
                    // 未加载
                    // item.loadType = 0;
                    this.renderRange[0] = item.date;
                    // item.data = this.createCalendarsOfView(item.date).data;
                    // 这里闭包异步解决 计算日历慢的问题
                    (function(_this, _item) {
                        setTimeout(() => {
                            _item.data = _this.createCalendarsOfView(_item.date).data;
                        }, 0);
                    })(this, item);
                    item.loadType = 1;
                    // this.calendars[index*1-1] = this.createCalendarsOfView(item.date);
                }
            }
            this.scrollTop = currentScrollTop;
        },
        render(date, range) {
            // 返回Promise 对象
            return new Promise((resolve, reject) => {
                this.calendars = [];
                if (this.isType(range, 'Array')) {
                    this.range = range;
                } else {
                    this.range = [];
                }
                let anchorDate;
                if (this.isType(date, 'Date')) {
                    anchorDate = date;
                } else {
                    // 去[回]程判断顺序都是 预选值 -> range[0]->range[1]-minDate
                    anchorDate = this.range[0] || this.range[1] || (!!this.minDateTime ? new Date(this.minDateTime) : new Date());
                }
                this.fixDate = this.getDateOfclearDateTime(anchorDate);
                // 重新获取今日时间戳
                this.todayDateTime = this.getTimeOfclearTime(new Date());
                this.createCalendars();
                this.show();
                //一定要异步否则无效,mounted无法保证组件全部已经在document中
                setTimeout(() => {
                    this.scrollTop = document.getElementById(this.getAnchor(anchorDate)).offsetTop || 0;
                }, 50);
                // 注册选择事件
                this.select = (date) => {
                    this.hide();
                    resolve(date);
                }
            });
        },
        createCalendars() {
            const {
                cache,
                countMonth,
                fixDate,
                view,
                minDateOfclearDateTime,
                maxDateOfclearDateTime,
                getDateOfdiffMonth,
                createCalendarsOfView
            } = this;
            const calendars = []; //所有日历列表
            // 计算初始化渲染区间 = 开始渲染区间+缓冲区间
            let currentRenderStartDate = getDateOfdiffMonth(fixDate, -cache);
            let currentRenderEndDate = getDateOfdiffMonth(fixDate, cache + view - 1);
            currentRenderStartDate = currentRenderStartDate - minDateOfclearDateTime > 0 ? currentRenderStartDate : minDateOfclearDateTime;
            currentRenderEndDate = currentRenderEndDate - maxDateOfclearDateTime < 0 ? currentRenderEndDate : maxDateOfclearDateTime;
            for (let i = 0, l = countMonth; i < l; i++) {
                let currentViewDate = getDateOfdiffMonth(minDateOfclearDateTime, i);
                if ((currentViewDate - currentRenderStartDate) >= 0 && (currentViewDate - currentRenderEndDate) <= 0) {
                    //type : -1-未加载 0-加载中 1-加载完成(可以加载)
                    calendars.push({
                        type: 1,
                        date: currentViewDate,
                        data: createCalendarsOfView(currentViewDate)
                    });
                    if (currentViewDate - currentRenderStartDate == 0) {
                        this.renderRange[0] = {
                            date: currentViewDate,
                            index: i
                        };
                    } else if (currentViewDate - currentRenderEndDate == 0) {
                        this.renderRange[1] = {
                            date: currentViewDate,
                            index: i
                        };
                    }
                } else {
                    //type : -1-未加载 0-加载中 1-加载完成(可以加载)
                    calendars.push({
                        type: -1,
                        date: currentViewDate,
                        data: [],
                    });
                }
            }

            this.calendars = calendars;
        },
        createCalendarsOfView(currentViewDate) {
            const {
                week,
                createTodayObj,
                getMaxDate
            } = this;
            // 渲染月份日历
            const currentYear = currentViewDate.getFullYear();
            const currentMonth = currentViewDate.getMonth();
            const weekdayOfFirstDay = currentViewDate.getDay();
            const daysOfLastMonth = (weekdayOfFirstDay - week + 7) % 7;
            const maxDateOfCurrentMonth = getMaxDate(currentYear, currentMonth);
            const month = []; //月
            // 上月填补天数
            if (daysOfLastMonth > 0) {
                let maxDateOfLastMonth = getMaxDate(currentYear, currentMonth - 1);
                for (let n = (maxDateOfLastMonth - daysOfLastMonth + 1), m = maxDateOfLastMonth; n <= m; n++) {
                    const currentDate = new Date(currentYear, currentMonth - 1, n);
                    month.push(createTodayObj(currentDate, -1, n));
                }
            }
            // 当前月
            for (let n = 1, m = maxDateOfCurrentMonth; n <= m; n++) {
                const currentDate = new Date(currentYear, currentMonth, n);
                month.push(createTodayObj(currentDate, 0, n));
            }
            // 下月
            if (month.length % 7 != 0) {
                // 非6*7计算(如果按照6*7计算则m=6*7-month.length)
                for (let n = 1, m = (7 - month.length % 7); n <= m; n++) {
                    const currentDate = new Date(currentYear, currentMonth + 1, n);
                    month.push(createTodayObj(currentDate, 1, n));
                }
            }
            return month;
        },
        createTodayObj(date, type, day) {
            const {
                minDateTime,
                maxDateTime,
                todayDateTime
            } = this;
            const r = {
                date,
                day,
                type,
                isAvailable: type == 0 || false, // 是否有效(上下月都是无效的)
                isToday: false //是否今天
            }
            const currentDateTime = date.getTime();
            // 是否有效(在minDate、maxDate之间)
            if ((!!minDateTime && currentDateTime < minDateTime) || (!!maxDateTime && currentDateTime > maxDateTime)) {
                r.isAvailable = false;
            }
            // 是否今日
            if (currentDateTime === todayDateTime) {
                r.isToday = true;
            }
            return r;
        },
        createClass(data) {
            const {
                range
            } = this;
            const className = [];
            const currTime = data.date.getTime();
            const rangeStartTime = !!range[0] ? range[0].getTime() : null;
            const rangeEndTime = !!range[1] ? range[1].getTime() : null;
            // 今日
            data.isToday && className.push('today');
            // 选中
            if (currTime === rangeStartTime || currTime === rangeEndTime) {
                className.push('selected');
            }
            // 经过
            if (!!rangeStartTime && !!rangeEndTime && currTime > rangeStartTime && currTime < rangeEndTime) {
                className.push('range');
            }
            return className;
        },
        hide() {
            // 隐藏
            this.display = false;
        },
        show() {
            // 显示
            this.display = true;
        },
        isType(val, type) {
            // 判断val是否是type类型
            return Object.prototype.toString.call(val) === `[object ${type}]`
        },
        getAnchor(date) {
            let m = date.getMonth() + 1;
            m = m > 9 ? m : `0${m}`;
            return `_${this.tag}_${date.getFullYear()}_${m}_`;
        },
        getDateOfdiffMonth(date = new Date(), diffMonth = 0) {
            // 获取date日期相差diffMonth月份的日期
            const y = date.getFullYear();
            const m = date.getMonth();
            return new Date(y, m + diffMonth * 1, 1);
        },
        getMaxDate(year, month) {
            // 获取当前年月的最大天数
            return new Date(new Date(year, month + 1, 1).getTime() - 1 * 24 * 60 * 60 * 1000).getDate();
        },
        getDateOfclearDateTime(date = new Date()) {
            // 清除时间后的日期对象
            return this.isType(date, 'Date') ? new Date(date.getFullYear(), date.getMonth(), 1) : null;
        },
        getTimeOfclearTime(date) {
            // 清除时间后的时间戳
            return this.isType(date, 'Date') ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() : null;
        },
    }
}
</script>
<style lang="scss" scoped>
@import './calendar.beta.scss'
</style>
