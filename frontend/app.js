document.addEventListener("DOMContentLoaded",(event)=> {
    console.log("Dom is ready to load")
     
       
    let Devices = []
    let SearchTerm = ""
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


            console.log(data.devices)
            
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


    UpdateDashboard()
    setInterval(UpdateDashboard, 5000)

})