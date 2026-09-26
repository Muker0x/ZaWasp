document.addEventListener("DOMContentLoaded",(event)=> {
     
       
    let Devices = []
    let SearchTerm = ""
    let ResourceRange = 7
    let ResourceDevice = "all"
    let ResourceHistory = []
    function RenderDevices(devices) {

const DeviceList = document.querySelector("#device-list")
    
        DeviceList.innerHTML = ""
        const Months = [
            "Jan", "Feb", "Mar",
            "Apr", "May", "Jun",
            "Jul", "Aug", "Sep",
            "Oct", "Nov", "Dec"
        ]


        devices.forEach(device => {
                
            const LastSeen = new Date(device.last_seen)

            const LastSeenDate = LastSeen.getDate()
            const LastSeenMonth = Months[LastSeen.getMonth()]
            const LastSeenHours = String(LastSeen.getHours()).padStart(2,"0")
            const LastSeenMinutes = String(LastSeen.getMinutes()).padStart(2,"0")

            const row = document.createElement("tr")
            
            const StatusClass = device.status === "Online"
                ? "status-online"
                : "status-offline"
            row.innerHTML = `
                <td>${device.username}</td>
                <td>${device.hostname}</td>
                <td>${device.ip_address}</td>
                <td>${device.system}</td>
                <td>${device.cpu_usage}%</td>
                <td>${device.ram_usage}%</td>
                <td>
                    <span class="status-badge ${StatusClass}">
                        ${device.status}
                    </span>
                </td>
                <td>${LastSeenDate} ${LastSeenMonth}, ${LastSeenHours}:${LastSeenMinutes}</td>
            `
    
            DeviceList.appendChild(row)
        })
    }
    function UpdateDashboard(){
        fetch("http://127.0.0.1:5000/api/devices")
    .then(Response => {
        const ConnectionIndicator = document.querySelector("#connection-text")
        const ConnectionDot = document.querySelector(".connection-dot")
            if(Response.ok){
                ConnectionIndicator.textContent = "Connected"
                ConnectionDot.style.background = "Green"
            } 
        

        if(!Response.ok){
            throw new Error(`HTTP Error ${Response.status}`)
        }
        return Response.json()
    })

    
    
    .then(data => {

            Devices = data.devices
            UpdateResourceDeviceSelector()


            
            const TotalDevices = document.querySelector("#total-devices")

            const OnlineDevices = data.devices.filter(device =>{
                return device.status === "Online"
            })

            const OnlineDeviceStat = document.querySelector("#online-devices")

            TotalDevices.textContent = data.devices.length

            OnlineDeviceStat.textContent = OnlineDevices.length

            let TotalCpu = 0 
            let AvgCpu = 0
            data.devices.forEach(device =>{
                TotalCpu += device.cpu_usage
            })
            
            if(data.devices.length !== 0) {
                 AvgCpu = TotalCpu / data.devices.length
            }

            const AvgCpuStat = document.querySelector("#avg-cpu-stat")
            
            AvgCpuStat.textContent = `${AvgCpu}%`

            FilterDevices()
           
             const RegisteredDevicesIndicator = document.querySelector("#registered-devices-indicator")

            RegisteredDevicesIndicator.textContent = `${data.devices.length} registered device`

            if(data.devices.length !== 1) {
                RegisteredDevicesIndicator.textContent = `${data.devices.length} registered devices`

            }
            else{
                RegisteredDevicesIndicator.textContent = `${data.devices.length} registered device`
            }
            
        })
        .catch(error =>{
            console.log("Failed to fetch devices", error)
            const ConnectionDot = document.querySelector(".connection-dot")
            const ConnectionIndicator = document.querySelector("#connection-text")
            ConnectionIndicator.textContent = "Connection lost"
            ConnectionDot.style.background = "Red"

        })

    }

        
    const SearchInput = document.querySelector(".search")

    SearchInput.addEventListener("input", () => {

        SearchTerm = SearchInput.value.toLowerCase()

        FilterDevices()
    })


    function FilterDevices() {

        const FilteredDevices = Devices.filter(device => {

            return (
                device.username.toLowerCase().includes(SearchTerm) ||
                device.hostname.toLowerCase().includes(SearchTerm) ||
                device.ip_address.toLowerCase().includes(SearchTerm) ||
                device.system.toLowerCase().includes(SearchTerm) ||
                device.status.toLowerCase().includes(SearchTerm)
            )
        })

        RenderDevices(FilteredDevices)
    }

    function UpdateResourceChart() {

        let ResourceUrl = ""

        if(ResourceDevice === "all"){
            ResourceUrl = `http://127.0.0.1:5000/api/resources?days=${ResourceRange}`

        }
        else {
            ResourceUrl = `http://127.0.0.1:5000/api/devices/${ResourceDevice}/resources?days=${ResourceRange}`
        }
        fetch(ResourceUrl)
        .then(response => response.json())
        .then(data => {
            ResourceHistory = data.history
            const history = ResourceHistory
            const chart = document.querySelector("#resource-chart-svg")
            if (history.length === 0) {
                chart.innerHTML = ""
                return
            }

            const CpuPoints = history.map((item, index) => {
                const x = history.length === 1
                    ? 0
                    : (index / (history.length - 1)) * 600
            
                const y = 200 - (item.cpu_usage / 100) * 200
            
                return `${x},${y}`
            })
            const RamPoints = history.map((item, index) => {
                const x = history.length === 1
                    ? 0
                    : (index / (history.length - 1)) * 600
            
                const y = 200 - (item.ram_usage / 100) * 200
            
                return `${x},${y}`

            })
            

            chart.innerHTML = `    
            <polyline
                points="${CpuPoints.join(" ")}"
                fill="none"
                stroke="#D6A84F"
                stroke-width="2"
            />

            <polyline
                points="${RamPoints.join(" ")}"
                fill="none"
                stroke="#8A8172"
                stroke-width="2"
            />
        `

        })
        .catch(error => {
            console.log("Failed to fetch resource history",error)
        })
    }
    const ResourceChart = document.querySelector("#resource-chart-svg")

    ResourceChart.addEventListener("mousemove", (event)=> {
        const history = ResourceHistory

        if (history.length === 0) {
            return
        }

        const rect = ResourceChart.getBoundingClientRect()

        const mouseX = event.clientX - rect.left
        const chartWidth = rect.width

        const index = Math.round(
            (mouseX / chartWidth) * (history.length -1)
        )

        const point = history[index]

        if(!point){
            return
        }

        const Tooltip = document.querySelector("#chart-tooltip")

        Tooltip.style.display = "block"
        Tooltip.style.left =`${mouseX +10}px`
        Tooltip.style.top = `${event.clientY - rect.top + 10}px `

        const PointDate = new Date(point.recorded_at)

        const Hours = String(PointDate.getHours()).padStart(2, "0")
        const Minutes = String(PointDate.getMinutes()).padStart(2, "0")
        
        Tooltip.innerHTML = `
            <div>${Hours}:${Minutes}</div>
            <div>CPU: ${point.cpu_usage.toFixed(1)}%</div>
            <div>RAM: ${point.ram_usage.toFixed(1)}%</div>
        `
    })

    ResourceChart.addEventListener("mouseleave", () => {
        const Tooltip = document.querySelector("#chart-tooltip")

        Tooltip.style.display = "none"
    })
        const ResourceRangeSelect = document.querySelector("#resource-range")

    ResourceRangeSelect.addEventListener("change",()=>{
        ResourceRange = Number(ResourceRangeSelect.value)
        UpdateResourceChart()
    })

    const ResourceDeviceSelect = document.querySelector("#resource-device")

    ResourceDeviceSelect.addEventListener("change",()=>{
    
        ResourceDevice = ResourceDeviceSelect.value
    
    
        UpdateResourceChart()
    })
    function UpdateResourceDeviceSelector(){
        const ResourceDeviceSelect = document.querySelector("#resource-device")

        const CurrentSelection = ResourceDeviceSelect.value

        ResourceDeviceSelect.innerHTML = `
            <option value="all">All Devices</option>
        `

        Devices.forEach(device =>{
            const Option = document.createElement("option")

            Option.value = device.device_id
            Option.textContent = `${device.hostname} (${device.username})`

            ResourceDeviceSelect.appendChild(Option)
        })

        if (
            CurrentSelection === "all" || 
            Devices.some(device => device.device_id === CurrentSelection)
        ){
            ResourceDeviceSelect.value = CurrentSelection
        }

    }

    UpdateDashboard()
    UpdateResourceChart()
    setInterval(UpdateDashboard, 5000)
    setInterval(UpdateResourceChart, 5000)

})