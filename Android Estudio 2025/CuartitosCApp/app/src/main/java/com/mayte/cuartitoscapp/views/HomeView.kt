package views
import Data.Student
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDirection.Companion.Content
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Homeview(navController: NavController){
  var Students = listOf<Student>(
    Student(1,"Paola", "Es inteligente","https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?cs=srgb&dl=pexels-olly-733872.jpg&fm=jpg"),
    Student(2,"Diego","Tambien es inteligente","imagen"),
    Student(3,"Jorge","Es chistoso","Imagen"),
    Student(4,"Emanuel","Amigo de un amigo","Imagen"),
    Student(5,"Derek","Cae bien","Imagen"),
  )
  Scaffold(
    topBar = {
      CenterAlignedTopAppBar(
        title = {
          Text("Dashboard")
        }
      )
    }
  ) {
    Content(it, Students, navController)
  }
}

@Composable
fun Content(paddingValues: PaddingValues, Students: List<Student>, navController: NavController){
  LazyColumn(
    modifier = Modifier
      .padding(paddingValues)
      .padding(horizontal = 10.dp)
  ){
    items(Students){ Students ->
      Box(
        modifier = Modifier
          .clickable{
            navController.navigate("Details/${Student.id}")
          }
          .size(150.dp)
      )

    }
  }
}


