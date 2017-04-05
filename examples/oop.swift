/*
 * desc : structure and class definition
 * docv : 0.0.1
 * plat : CodeIn
 * swif : 3.0.2
 */

struct Car {
    var weight = 0
    var horsepower = 0
    var name = ""
}

class CarPhysicalProperty {
    var carInfo = Car()
    var acceleration : Double = 0.0
    
    // private void function
    private func calAccelerate() {
        self.acceleration = 
            Double(self.carInfo.horsepower) / Double(self.carInfo.weight)
    }
    
    // constructor
    init(carWeight : Int, carHorsepower : Int, carName : String) {
        self.carInfo = Car(
            weight : carWeight, 
            horsepower : carHorsepower, 
            name : carName
        )
        
        self.calAccelerate()
    }
    
    // public Double function
    public func getCarAcc() -> Double {
        return(self.acceleration)
    }
    
    // public String function
    public func getCarName() -> String {
        return(self.carInfo.name)
    }
}

var firstCar = CarPhysicalProperty(
    carWeight : 100, carHorsepower : 200, carName : "FCar"
)
print("The accelerate of \(firstCar.getCarName()) is \(firstCar.getCarAcc()).") 
