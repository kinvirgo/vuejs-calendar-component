<template>
<div id="app">
  <h2>日历插件</h2>
  <div @click="selectDate">开始日期：{{ startDate && startDate.format() }}</div>
  <div class="calendar-container">
      <Calendar ref="myCalendar"
        v-model="startDate"
         :minDate = minDate
         :maxDate = maxDate
       ></Calendar>
  </div>
</div>
</template>

<script>
import Calendar from './component/calendar.vue'
export default {
  name: 'app',
  data() {
    return {
        startDate : null,
        sDate : "2018-11-22",
        minDate : new Date(2018, 10, 5),
        maxDate : new Date(2019, 10, 1)
    }
  },
  mounted() {
      // 格式化日期
    Date.prototype.format = function ( format ) {
        //默认标准格式
        var date = this;
        format = format || 'yyyy-MM-dd';
        var obj ={
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
        for(var i in obj)
        {
            format = format.replace(new RegExp(i+'+', 'g'), function(m)
            {
                var val = obj[i] + '';
                if(i == 'w') return (m.length > 2 ? '星期' : '周') + week[val];
                for(var j = 0, len = val.length; j < m.length - len; j++) val = '0' + val;
                return m.length == 1 ? val : val.substring(val.length - m.length);
            });
        }
        return format;
    };

  },
  components : {
      Calendar
  },
  methods: {
      selectDate(){
          // console.log(this.$refs);
          this.$refs.myCalendar.render( this.startDate );
      }
  }
}
</script>

<style lang="scss">
.calendar-container{
    position: fixed;
    top: 300px;
    bottom : 0;
    left : 0;
    right :0;
    z-index: 1000;
    background: #2762BF;
}
</style>
